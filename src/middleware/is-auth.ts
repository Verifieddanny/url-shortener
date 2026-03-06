import type { NextFunction, Response } from "express";
import jwt from "jsonwebtoken";
import type { CustomError, UserPayload, AuthRequest } from "../shared/types.js";

export const isAuth = (req: AuthRequest, res: Response, next: NextFunction) => {
  const authHeader = req.get("Authorization");

  if (!authHeader) {
    const error: CustomError = new Error("Not Authenticated");
    error.statusCode = 401;
    throw error;
  }

  const token = authHeader.split(" ")[1];

  if (!token) {
    const error: CustomError = new Error("Not Authenticated!");
    error.statusCode = 401;
    throw error;
  }

  let decodedToken: UserPayload = jwt.verify(
    token,
    process.env.SECRETE_KEY!,
  ) as UserPayload;

  if (!decodedToken) {
    const error: CustomError = new Error("Not Authenticated");
    error.statusCode = 401;
    throw error;
  }

  req.userId = decodedToken.userId;

  next();
};
