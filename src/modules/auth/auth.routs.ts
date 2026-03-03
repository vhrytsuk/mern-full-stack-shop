import { Router } from "express";
import { authController } from "./auth.module";

const authRouts = Router();

authRouts.post("/register", authController.register);
authRouts.post("/login", authController.login);

export default authRouts;
