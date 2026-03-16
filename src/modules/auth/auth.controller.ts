import { HTTPSTATUS } from "../../config/http.config";
import type { Request, Response } from "express";
import { AuthService } from "./auth.service";
import { asyncHandler } from "../../middleware/asyncHandler";
import {
  loginSchema,
  registerSchema,
  verificationEmailSchema,
} from "../../common/validators/auth.validator";
import {
  getAccessTokenCookieOptions,
  getRefreshTokenCookieOptions,
  setAuthenticationCookies,
} from "../../common/utils/cookie";
import { UnauthorizedException } from "../../common/utils/catch-errors";

export class AuthController {
  private authService: AuthService;

  constructor(AuthService: AuthService) {
    this.authService = AuthService;
  }

  public register = asyncHandler(
    async (req: Request, res: Response): Promise<any> => {
      const body = registerSchema.parse({
        ...req.body,
      });

      const { user } = await this.authService.register(body);

      return res.status(HTTPSTATUS.CREATED).json({
        message: "Register endpoint is working",
        data: user,
      });
    }
  );

  public login = asyncHandler(
    async (req: Request, res: Response): Promise<any> => {
      const userAgent = req.get("User-Agent") || "Unknown";

      const body = loginSchema.parse({
        ...req.body,
        userAgent,
      });

      const payload = {
        ...body,
        userAgent,
      };

      const { user, accessToken, refreshToken, mfaRequired } =
        await this.authService.login(payload);

      return setAuthenticationCookies({
        res,
        accessToken,
        refreshToken,
      })
        .status(HTTPSTATUS.OK)
        .json({
          message: "User logged in successfully",
          data: {
            user,
            mfaRequired,
          },
        });
    }
  );

  public refreshToken = asyncHandler(
    async (req: Request, res: Response): Promise<any> => {
      const { refreshToken } = req.cookies;

      if (!refreshToken) {
        throw new UnauthorizedException("Refresh token is missing");
      }

      const { accessToken, newRefreshToken } =
        await this.authService.refreshToken(refreshToken);

      if (newRefreshToken) {
        res.cookie(
          "refreshToken",
          newRefreshToken,
          getRefreshTokenCookieOptions()
        );
      }

      return res
        .status(HTTPSTATUS.OK)
        .cookie("accessToken", accessToken, getAccessTokenCookieOptions())
        .json({
          message: "Access token refreshed successfully",
        });
    }
  );

  public verifyEmail = asyncHandler(
    async (req: Request, res: Response): Promise<any> => {
      const { code } = verificationEmailSchema.parse(req.body);

      await this.authService.verifyEmail(code);

      return res.status(HTTPSTATUS.OK).json({
        message: "Email verified successfully",
      });
    }
  );
}
