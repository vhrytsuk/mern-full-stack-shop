import jwt from "jsonwebtoken";
import { ErrorCode } from "../../common/enums/error-code.enum";
import { VerificationEnum } from "../../common/enums/verification-code.enum";
import { LoginData, RegisterData } from "../../common/interface/auth.interface";
import { BadRequestException } from "../../common/utils/catch-errors";
import { fortyFiveMinutesFromNow } from "../../common/utils/date-time";
import SessionModel from "../../database/models/session.model";
import UserModel from "../../database/models/user.model";
import VerificationCodeModel from "../../database/models/verification.model";
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

    const accessToken = jwt.sign(
      {
        userId: user._id,
        sessionId: session._id,
      },
      env.JWT_ACCESS_SECRET,
      {
        audience: ["user"],
        expiresIn: env.JWT_ACCESS_TTL_MIN,
      }
    );

    const refreshToken = jwt.sign(
      {
        sessionId: session._id,
      },
      env.JWT_REFRESH_SECRET,
      {
        audience: ["user"],
        expiresIn: env.JWT_REFRESH_TTL_DAYS,
      }
    );

    return {
      user,
      accessToken,
      refreshToken,
      mfaRequired: false, // Placeholder for future MFA implementation
    };
  }
}
