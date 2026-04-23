import { Router } from "express";
import { authController } from "./auth.module";
import { authenticateJWT } from "../../common/strategies/jwt.strategy";

const authRouts = Router();

authRouts.post("/register", authController.register);
authRouts.post("/login", authController.login);
authRouts.post("/refresh", authController.refreshToken);

authRouts.post("/logout", authenticateJWT, authController.logout);

authRouts.post("/password/forgot", authController.forgotPassword);
authRouts.post("/password/reset", authController.resetPassword);

authRouts.post("/verify/email", authController.verifyEmail);

export default authRouts;
