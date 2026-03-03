import { HTTPSTATUS } from "../../config/http.config";
import type { Request, Response } from "express";
import { AuthService } from "./auth.service";
import { asyncHandler } from "../../middleware/asyncHandler";
import {
  loginSchema,
  registerSchema,
} from "../../common/validators/auth.validator";
import { setAuthenticationCookies } from "../../common/utils/cookie";

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
}
