import { z } from "zod";

const emailSchema = z.email("Invalid email address");
const passwordSchema = z
  .string()
  .min(8, "Password must be at least 6 characters long")
  .max(255, "Password must be less than 255 characters long");

export const registerSchema = z
  .object({
    name: z
      .string()
      .trim()
      .min(2, "Name must be at least 2 characters long")
      .max(100, "Name must be less than 100 characters long"),
    email: emailSchema,
    password: passwordSchema,
    confirmPassword: passwordSchema,
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

export const loginSchema = z.object({
  email: emailSchema,
  password: passwordSchema,
  userAgent: z.string().optional(),
});
