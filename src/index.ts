import cors from "cors";
import "dotenv/config";
import express from "express";
import cookiesParser from "cookie-parser";
import { env } from "./config/env";
import connectDB from "./database/database";
import { errorHandler } from "./middleware/errorHandler";
import { HTTPSTATUS } from "./config/http.config";
import { asyncHandler } from "./middleware/asyncHandler";
import authRouts from "./modules/auth/auth.routs";
import passport from "./middleware/passport";
import { authenticateJWT } from "./common/strategies/jwt.strategy";
import sessionRoutes from "./modules/session/session.routes";
import mfaRoutes from "./modules/mfa/mfa.routes";

const app = express();
const BASE_PATH = env.BASE_PATH;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(
  cors({
    origin: env.CORS_ORIGIN,
    credentials: true,
  })
);
app.use(cookiesParser());
app.use(passport.initialize());

app.get(
  "/",
  asyncHandler(async (req, res, next) => {
    res.status(HTTPSTATUS.OK).json({
      message: "Hello Subscribers!!!",
    });
  })
);

app.use(`${BASE_PATH}/auth`, authRouts);
app.use(`${BASE_PATH}/mfa`, mfaRoutes);
app.use(`${BASE_PATH}/session`, authenticateJWT, sessionRoutes);

app.use(errorHandler);

app.listen(env.PORT, async () => {
  console.log(`Server is running on port ${env.PORT}`);
  await connectDB();
});
