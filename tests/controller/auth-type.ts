import type { Response } from "express";

export interface TestResponse extends Response {
  statusCode: number;
  auth_token: string;
  loadedUser: string;
}
