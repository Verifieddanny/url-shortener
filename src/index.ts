import express from "express";
import type { Application, Request, Response, NextFunction } from "express";
import { connect } from "mongoose";
import dotenv from "dotenv";
import type { CustomError } from "./shared/types.js";
import urlShortnerRouter from "./routes/url-shortner.js";
import rootAccessRouter from "./routes/root-access.js";
import AuthRouter from "./routes/auth.js";

dotenv.config();

const app: Application = express();

app.use(express.json());

app.use((req, res, next) => {
  res.setHeader("Access-Control-Allow_Origin", "*");
  res.setHeader(
    "Access-Control-Allow-Methods",
    "GET, POST, PUT, PATCH, DELETE",
  );
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
  next();
});

app.use("/auth", AuthRouter);
app.use(rootAccessRouter);
app.use("/shorten", urlShortnerRouter);

app.use("/", (_req: Request, res: Response) => {
  res.status(200).json({ message: "welcome to url shortner" });
});

app.use(
  (
    error: CustomError,
    req: Request,
    res: Response,
    next: NextFunction,
  ): void => {
    const statusCode = error.statusCode || 500;
    const message = error.message;
    const data = error.data;

    res.status(statusCode).json({ message, data });
  },
);

const dbConnected = await connect(process.env.MONGODB_URL!);

if (dbConnected) {
  app.listen(8080, () => {
    console.log("server running on port 8080");
  });
}
