import { Router } from "express";
import { authController } from "./auth.module";

const authRouts = Router();

authRouts.post("/register", authController.register);
authRouts.post("/login", authController.login);
authRouts.post("/refresh", authController.refreshToken);

authRouts.post("/verify/email", authController.verifyEmail);

export default authRouts;
