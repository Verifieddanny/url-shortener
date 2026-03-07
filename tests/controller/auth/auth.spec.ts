import { expect } from "../../setup.js";
import * as sinon from "sinon";
import user from "../../../src/models/user.js";
import type { IUser } from "../../../src/models/user.js";
import { getStats, login, signUp } from "../../../src/controllers/auth.js";
import type { Request, Response } from "express";
import mongoose from "mongoose";
import type { AuthRequest } from "../../../src/shared/types.js";
import type { TestResponse } from "./auth-type.js";
import urlShortner from "../../../src/models/url-shortner.js";
import { getDummyUrl, loginHelper } from "./auth-test-helper.js";
import { mongooseConnect } from "../../shared/before-hook.js";

const TEST_SHORTCODE = "dAP4V5fR";
const TEST_URL = "https://google.com";

describe("Auth Controller - SignUp", () => {
  before(async () => {
    await mongooseConnect();
    await user.deleteMany({});
  });

  it("should throw an error with code 500 if accessing the database fails", async () => {
    const userStub = sinon.stub(user, "findOne");
    userStub.throws();

    const req = {
      body: {
        firstName: "Test Name",
        lastName: "Test Name",
        username: "devTester",
        email: "test@test.com",
        password: "1234567890",
      },
    } as Request;

    const next = sinon.spy();

    await signUp(req, {} as Response, next);

    expect(next.calledOnce).to.be.true;
    expect(next.firstCall.args[0]).to.have.property("statusCode", 500);

    userStub.restore();
  });

  it("should create new user", async () => {
    const totalUser = await user.countDocuments();

    expect(totalUser).to.be.equals(1);
  });
});

describe("Auth Controller - Login", () => {
  let testUser: IUser;
  before(async () => {
    const result = await mongooseConnect();
    testUser = result.testUser;
  });

  it("should throw an error with code 401 if user is not authenticated", async () => {
    const req = {
      body: {
        username: "devTester2",
        password: "1234567890",
      },
    } as Request;

    const next = sinon.spy();

    await login(req, {} as Response, next);

    expect(next.calledOnce).to.be.true;
    expect(next.firstCall.args[0]).to.have.property("statusCode", 401);
  });

  it("should return a jwt and userId", async () => {
    const req = {
      body: {
        username: "devTester",
        password: "1234567890",
      },
    } as Request;

    const res = {
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

    expect(res.statusCode).to.equal(200);
    expect(res.loadedUser).to.equal(testUser._id.toString());
  });
});

describe("Auth Controller - GetStats", () => {
  let testUser: IUser;
  let dummyUser: IUser;

  before(async () => {
    const result = await mongooseConnect({ createSecondaryUser: true });
    testUser = result.testUser;

    if (result.dummyUser) {
      dummyUser = result.dummyUser;
    }
  });

  it("should throw an error is Link doesn't exist", async () => {
    const req = {
      params: {
        shortCode: "invalidCode",
      },
      userId: testUser._id.toString(),
    } as unknown as AuthRequest;

    const next = sinon.spy();

    await getStats(req, {} as Response, next);

    expect(next.calledOnce).to.be.true;
    expect(next.firstCall.args[0]).to.have.property("statusCode", 404);
  });

  it("should throw an error if not authorized to get stat", async () => {
    let { req, res } = await loginHelper();

    await getDummyUrl(TEST_URL, dummyUser._id.toString(), TEST_SHORTCODE);

    req["params"] = {
      shortCode: TEST_SHORTCODE,
    };

    req.userId = res.loadedUser;

    const next = sinon.spy();

    await getStats(req, {} as Response, next);

    expect(next.calledOnce).to.be.true;
    expect(next.firstCall.args[0]).to.have.property("statusCode", 403);
  });

  it("should yield an actual existing stat", async () => {
    let { req, res } = await loginHelper();

    const dummyUrl = await getDummyUrl(TEST_URL, testUser._id.toString());

    req["params"] = {
      shortCode: dummyUrl.shortCode,
    };
    req.userId = res.loadedUser;

    res.json = sinon.spy();

    await getStats(req, res, () => {});

    expect(res.statusCode).to.be.equals(200);
    expect(res.json.calledOnce).to.be.true;
    expect(res.json.firstCall.args[0]).to.have.property(
      "message",
      "Status Fetched",
    );
    expect(res.json.firstCall.args[0]).to.have.property("data");
  });
});
