import jwt, { SignOptions, VerifyOptions } from "jsonwebtoken";
import mongoose from "mongoose";
import { env } from "../../config/env";

export type AccessTokenPayload = {
  userId: mongoose.Types.ObjectId | string;
  sessionId: mongoose.Types.ObjectId | string;
};

export type RefreshTokenPayload = {
  sessionId: mongoose.Types.ObjectId | string;
};

type SignOptsAndSecret = SignOptions & {
  secret: string;
};

const defaults: SignOptions = {
  audience: ["user"],
};

export const accessTokenSignOptions: SignOptsAndSecret = {
  expiresIn: env.JWT_ACCESS_TTL,
  secret: env.JWT_ACCESS_SECRET,
};

export const refreshTokenSignOptions: SignOptsAndSecret = {
  expiresIn: env.JWT_REFRESH_TTL,
  secret: env.JWT_REFRESH_SECRET,
};

export const signJwtToken = (
  payload: AccessTokenPayload | RefreshTokenPayload,
  options?: SignOptsAndSecret
) => {
  const { secret, ...opts } = options || accessTokenSignOptions;

  return jwt.sign(payload, secret, {
    ...defaults,
    ...opts,
  });
};

export const verifyJwtToken = <TPayload extends object = AccessTokenPayload>(
  token: string,
  options?: VerifyOptions & { secret: string }
) => {
  try {
    const { secret = env.JWT_ACCESS_SECRET, ...opts } = options || {};

    const payload = jwt.verify(token, secret, {
      ...defaults,
      ...opts,
    } as VerifyOptions) as TPayload;

    return { payload };
  } catch (err: any) {
    return {
      error: err.message,
    };
  }
};
