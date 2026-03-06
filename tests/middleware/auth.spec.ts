import { expect } from "../setup.js";
import * as sinon from "sinon";
import jwt from "jsonwebtoken";
import { isAuth } from "../../src/middleware/is-auth.js";
import type { Response } from "express";
import { getTestReq } from "./auth-test-helpers.js";

describe("Auth Middleware", () => {
  it("should throw an error if no authorization header is present", () => {
    const req = getTestReq(undefined);

    expect(isAuth.bind(this, req, {} as Response, () => {})).to.throw(
      "Not Authenticated",
    );
  });

  it("Should throw an error if the authorization header is only one string", () => {
    const req = getTestReq("xyz");

    expect(isAuth.bind(this, req, {} as Response, () => {})).to.throw(
      "Not Authenticated!",
    );
  });

  it("Should throw an error if the token cannot be verified", () => {
    const req = getTestReq("Bearer thisWillFail!");

    expect(isAuth.bind(this, req, {} as Response, () => {})).to.throw();
  });

  it("Should yield a user id after decoding a valid token", () => {
    const req = getTestReq("Bearer mockToken");

    const jwtStub = sinon.stub(jwt, "verify") as sinon.SinonStub;

    jwtStub.returns({
      userId: "abc",
    });

    isAuth(req, {} as Response, () => {});

    expect(req).to.have.property("userId", "abc");

    jwtStub.restore();
  });
});
