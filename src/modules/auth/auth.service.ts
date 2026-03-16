import { ErrorCode } from "../../common/enums/error-code.enum";
import { VerificationEnum } from "../../common/enums/verification-code.enum";
import { LoginData, RegisterData } from "../../common/interface/auth.interface";
import {
  BadRequestException,
  UnauthorizedException,
} from "../../common/utils/catch-errors";
import {
  calculateExpirationDate,
  fortyFiveMinutesFromNow,
  ONE_DAY_IN_MS,
} from "../../common/utils/date-time";
import SessionModel from "../../database/models/session.model";
import UserModel from "../../database/models/user.model";
import VerificationCodeModel from "../../database/models/verification.model";
import {
  RefreshTokenPayload,
  refreshTokenSignOptions,
  signJwtToken,
  verifyJwtToken,
} from "../../common/utils/jwt";
import { env } from "../../config/env";

export class AuthService {
  public async register(data: RegisterData) {
    const { name, email, password } = data;

    const existingUser = await UserModel.exists({ email });

    if (existingUser) {
      throw new BadRequestException(
        "User already exists with this email",
        ErrorCode.AUTH_EMAIL_ALREADY_EXISTS
      );
    }

    const newUser = await UserModel.create({
      name,
      email,
      password,
    });

    const userId = newUser._id;

    const verificationCode = await VerificationCodeModel.create({
      userId,
      type: VerificationEnum.EMAIL_VERIFICATION,
      expiresAt: fortyFiveMinutesFromNow(),
    });

    return {
      user: newUser,
    };
  }

  public async login(data: LoginData) {
    const { email, password, userAgent } = data;

    const user = await UserModel.findOne({ email });

    if (!user) {
      throw new BadRequestException(
        "Invalid email or password",
        ErrorCode.AUTH_USER_NOT_FOUND
      );
    }

    const isPasswordValid = await user.comparePassword(password);

    if (!isPasswordValid) {
      throw new BadRequestException(
        "Invalid email or password",
        ErrorCode.AUTH_INVALID_CREDENTIALS
      );
    }

    const session = await SessionModel.create({
      userId: user._id,
      userAgent: userAgent || "Unknown",
    });

    const accessToken = signJwtToken({
      userId: user._id,
      sessionId: session._id,
    });

    const refreshToken = signJwtToken(
      {
        sessionId: session._id,
      },
      refreshTokenSignOptions
    );

    return {
      user,
      accessToken,
      refreshToken,
      mfaRequired: false, // Placeholder for future MFA implementation
    };
  }

  public async refreshToken(refreshToken: string) {
    const { payload } = verifyJwtToken<RefreshTokenPayload>(refreshToken, {
      secret: refreshTokenSignOptions.secret,
    });

    if (!payload) {
      throw new UnauthorizedException("Invalid refresh token");
    }

    const session = await SessionModel.findById(payload.sessionId);
    const now = Date.now();

    if (!session) {
      throw new UnauthorizedException("Session does not exist");
    }

    if (!session.expiredAt || session.expiredAt.getTime() <= now) {
      throw new UnauthorizedException("Session has expired");
    }

    const sessionRequireRefresh =
      session.expiredAt.getTime() - now < ONE_DAY_IN_MS;

    if (sessionRequireRefresh) {
      session.expiredAt = calculateExpirationDate(`${env.JWT_REFRESH_TTL}d`);

      await session.save();
    }

    const newRefreshToken = sessionRequireRefresh
      ? signJwtToken(
          {
            sessionId: session._id,
          },
          refreshTokenSignOptions
        )
      : undefined;

    const accessToken = signJwtToken({
      userId: session.userId,
      sessionId: session._id,
    });

    return {
      accessToken,
      newRefreshToken,
    };
  }

  public async verifyEmail(code: string) {
    const verificationRecord = await VerificationCodeModel.findOne({
      code,
      type: VerificationEnum.EMAIL_VERIFICATION,
      expiresAt: { $gt: new Date() },
    });

    if (!verificationRecord) {
      throw new BadRequestException("Invalid or expired verification code");
    }

    const updateUser = await UserModel.findByIdAndUpdate(
      verificationRecord.userId,
      { isEmailVerified: true },
      { new: true }
    );

    if (!updateUser) {
      throw new BadRequestException(
        "User not found for this verification code",
        ErrorCode.VALIDATION_ERROR
      );
    }

    await VerificationCodeModel.deleteOne({ _id: verificationRecord._id });

    return {
      user: updateUser,
    };
  }
}
