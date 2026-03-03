import cors from "cors";
import "dotenv/config";
import express from "express";
import cookiesParser from "cookie-parser";
import { env } from "./config/env";
import connectDB from "./database/database";
import { errorHandler } from "./middleware/errorHandler";
import { HTTPSTATUS } from "./config/http.config";
import { ca, th } from "zod/v4/locales";
import { asyncHandler } from "./middleware/asyncHandler";
import { BadRequestException } from "./common/utils/catch-errors";
import authRouts from "./modules/auth/auth.routs";

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

app.get(
  "/",
  asyncHandler(async (req, res, next) => {
    res.status(HTTPSTATUS.OK).json({
      message: "Hello Subscribers!!!",
    });
  })
);

app.use(`${BASE_PATH}/auth`, authRouts);

app.use(errorHandler);

app.listen(env.PORT, async () => {
  console.log(`Server is running on port ${env.PORT}`);
  await connectDB();
});
