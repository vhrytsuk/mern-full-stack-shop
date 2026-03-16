import type { Response, CookieOptions } from "express";
import { env } from "../../config/env";
import { calculateExpirationDate } from "./date-time";

type SetAuthenticationCookiesParams = {
  res: Response;
  accessToken: string;
  refreshToken: string;
};

export const REFRESH_PATH = `${env.BASE_PATH}/auth/refresh`;

const defaults = {
  httpOnly: true,
  secure: env.NODE_ENV === "production",
  sameSite: "strict" as const,
};

export const getRefreshTokenCookieOptions = (): CookieOptions => {
  const expiresIn = env.JWT_REFRESH_TTL;
  const expires = calculateExpirationDate(`${expiresIn}d`);

  return {
    ...defaults,
    expires,
    path: REFRESH_PATH,
  };
};

export const getAccessTokenCookieOptions = (): CookieOptions => {
  const expiresIn = env.JWT_ACCESS_TTL;

  const expires = calculateExpirationDate(`${expiresIn}m`);

  return {
    ...defaults,
    expires,
    path: "/",
  };
};

export const setAuthenticationCookies = ({
  res,
  accessToken,
  refreshToken,
}: SetAuthenticationCookiesParams): Response => {
  res.cookie("accessToken", accessToken, defaults);
  res.cookie("refreshToken", refreshToken, defaults);

  return res;
};

export const clearAuthenticationCookies = (res: Response): Response =>
  res.clearCookie("accessToken").clearCookie("refreshToken", {
    path: REFRESH_PATH,
  });
