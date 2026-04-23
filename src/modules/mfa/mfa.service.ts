import { Request } from "express";
import {
  BadRequestException,
  UnauthorizedException,
} from "../../common/utils/catch-errors";
import speakeasy from "speakeasy";
import UserModel from "../../database/models/user.model";
import qrcode from "qrcode";
import SessionModel from "../../database/models/session.model";
import { refreshTokenSignOptions, signJwtToken } from "../../common/utils/jwt";

export class MfaService {
  public async generateMFASetup(req: Request) {
    const userId = req.user?.id;

    if (!userId) {
      throw new UnauthorizedException("User not found in request");
    }

    const user = await UserModel.findById(userId);

    if (!user) {
      throw new UnauthorizedException("User not found");
    }

    if (user.userPreferences?.enable2FA) {
      return {
        message: "MFA is already enabled for this user",
      };
    }

    let secretKey = user.userPreferences.twoFactorSecret;

    if (!secretKey) {
      const secret = speakeasy.generateSecret({ name: "SecretName" });

      secretKey = secret.base32;

      // Save the secret key to the user's preferences
      user.userPreferences.twoFactorSecret = secretKey;
      await user.save();
    }

    const otpauthUrl = speakeasy.otpauthURL({
      secret: secretKey,
      label: user.email,
      issuer: "squeezy.com", // change it
      encoding: "base32",
    });

    const qrImageUrl = await qrcode.toDataURL(otpauthUrl);

    return {
      message: "Scan the QR code with your authenticator app to set up MFA",
      secret: secretKey,
      qrImageUrl,
    };
  }

  public async verifyMFASetup(req: Request, code: string, secretKey: string) {
    const userId = req.user?.id;

    if (!userId) {
      throw new UnauthorizedException("User not authenticated");
    }

    const user = await UserModel.findById(userId);

    if (!user) {
      throw new UnauthorizedException("User not found");
    }

    if (user.userPreferences?.enable2FA) {
      return {
        message: "MFA is already enabled for this user",
        userPreferences: {
          enable2FA: user.userPreferences.enable2FA,
        },
      };
    }

    const isValid = speakeasy.totp.verify({
      secret: secretKey,
      encoding: "base32",
      token: code,
    });

    if (!isValid) {
      throw new BadRequestException("Invalid MFA code. Please try again.");
    }

    user.userPreferences.enable2FA = true;
    await user.save();

    return {
      message: "MFA setup completed successfully",
      userPreferences: {
        enable2FA: user.userPreferences.enable2FA,
      },
    };
  }
  public async revokeMFA(req: Request) {
    const user = req.user;

    if (!user) {
      throw new UnauthorizedException("User not authorized");
    }

    if (!user.userPreferences.enable2FA) {
      return {
        message: "MFA is not enabled",
        userPreferences: {
          enable2FA: user.userPreferences.enable2FA,
        },
      };
    }

    user.userPreferences.twoFactorSecret = "";
    user.userPreferences.enable2FA = false;

    await (user as any).save();

    return {
      message: "MFA revoke successfully",
      userPreferences: {
        enable2FA: user.userPreferences.enable2FA,
      },
    };
  }

  public async verifyMFAForLogin(
    code: string,
    email: string,
    userAgent?: string
  ) {
    const user = await UserModel.findOne({ email });

    if (!user) {
      throw new BadRequestException("User not found");
    }

    if (
      !user.userPreferences.enable2FA &&
      !user.userPreferences.twoFactorSecret
    ) {
      throw new UnauthorizedException("MFA not enabled for this user");
    }

    const isValid = speakeasy.totp.verify({
      secret: user.userPreferences?.twoFactorSecret || "",
      encoding: "base32",
      token: code,
    });

    if (!isValid) {
      throw new BadRequestException("Invalid MFA code. Please try again.");
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
    };
  }
}
