import { nanoid } from "nanoid";
import { login } from "../../../src/controllers/auth.js";
import urlShortner from "../../../src/models/url-shortner.js";
import type { AuthRequest } from "../../../src/shared/types.js";
import type { TestResponse } from "./auth-type";

export const loginHelper = async () => {
  let req = {
    body: {
      username: "devTester",
      password: "1234567890",
    },
  } as AuthRequest;

  let res = {
    statusCode: 500,
    auth_token: "",
    loadedUser: "",
    status(code: number) {
      this.statusCode = code;
      return this;
    },
    json(data: { auth_token: string; userId: string }) {
      this.auth_token = data.auth_token;
      this.loadedUser = data.userId;
    },
  } as TestResponse;

  await login(req, res, () => {});

  return {
    req,
    res,
  };
};

export const getDummyUrl = async (
  longUrl: string,
  creator: string,
  shortCode?: string,
) => {
  const generatedCode = shortCode ? shortCode : nanoid(4);
  const dummyUrl = new urlShortner({
    longUrl,
    shortCode: generatedCode,
    creator,
  });

  return await dummyUrl.save();
};
