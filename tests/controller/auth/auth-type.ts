import type { Response } from "express";
import * as sinon from 'sinon';

export interface TestResponse extends Response {
  statusCode: number;
  auth_token: string;
  loadedUser: string;
  message?: string;
  data?: {};
  json: sinon.SinonSpy;
}
