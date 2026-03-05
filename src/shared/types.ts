import type { Request } from "express";
import type { ValidationError } from "express-validator";
import type { JwtPayload } from "jsonwebtoken";

export type CustomError = Error & {
  statusCode?: number;
  data?: ValidationError[];
};

export interface UserPayload extends JwtPayload {
  email: string;
  userId: string;
}

export interface AuthRequest extends Request {
  userId?: string;
}
