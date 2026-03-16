import "dotenv/config";
import { z } from "zod";

const EnvSchema = z.object({
  NODE_ENV: z
    .enum(["development", "production", "test"])
    .default("development"),
  PORT: z.string().default("8000"),
  DATABASE_URL: z.string().min(1),
  BASE_PATH: z.string().default("/api/v1"),

  JWT_ACCESS_SECRET: z.string().min(16),
  JWT_REFRESH_SECRET: z.string().min(16),
  JWT_ACCESS_TTL: z.coerce.number().default(15),
  JWT_REFRESH_TTL: z.coerce.number().default(30),

  COOKIE_SECURE: z.coerce.boolean().default(false),

  CORS_ORIGIN: z.string().default("http://localhost:3000"),
  RESEND_API_KEY: z.string().min(1),
  MAILER_SENDER: z.email(),
});

export const env = EnvSchema.parse(process.env);
