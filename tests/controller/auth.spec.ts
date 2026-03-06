import { expect } from "../setup.js";
import dotenv from "dotenv";
import * as sinon from "sinon";
import user from "../../src/models/user.js";
import type { IUser } from "../../src/models/user.js";
import bcrypt from "bcryptjs";
import { getStats, login, signUp } from "../../src/controllers/auth.js";
import type { Request, Response } from "express";
import mongoose from "mongoose";
import type { AuthRequest } from "../../src/shared/types.js";
import type { TestResponse } from "./auth-type.js";
import urlShortner from "../../src/models/url-shortner.js";

dotenv.config();

const TEST_SHORTCODE = "dAP4V5fR";

describe("Auth Controller - SignUp", () => {
  before(async () => {
    const isConnected = await mongoose.connect(process.env.TEST_MONGODB_URL!);

    if (isConnected) {
      const hashedPassword = await bcrypt.hash("1234567890", 12);

      const userInMem = new user({
        firstName: "Test Name",
        lastName: "Test Name",
        username: "devTester",
        email: "test@test.com",
        password: hashedPassword,
      });
      await userInMem.save();
    }
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

  after(async () => {
    const hasRemoved = await user.deleteMany({});
    if (hasRemoved) {
      mongoose.disconnect();
    }
  });
});

describe("Auth Controller - Login", () => {
  let testUser: IUser;
  before(async () => {
    const isConnected = await mongoose.connect(process.env.TEST_MONGODB_URL!);

    if (isConnected) {
      const hashedPassword = await bcrypt.hash("1234567890", 12);

      const userInMem = new user({
        firstName: "Test Name",
        lastName: "Test Name",
        username: "devTester",
        email: "test@test.com",
        password: hashedPassword,
      });

      testUser = await userInMem.save();
    }
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

  after(async () => {
    const hasRemoved = await user.deleteMany({});
    if (hasRemoved) {
      mongoose.disconnect();
    }
  });
});

describe("Auth Controller - GetStats", () => {
  let testUser: IUser;
  let dummyUser: IUser;

  before(async () => {
    const isConnected = await mongoose.connect(process.env.TEST_MONGODB_URL!);

    if (isConnected) {
      const hashedPassword = await bcrypt.hash("1234567890", 12);

      const userInMem = new user({
        firstName: "Test Name",
        lastName: "Test Name",
        username: "devTester",
        email: "test@test.com",
        password: hashedPassword,
      });

      testUser = await userInMem.save();

      const otherUser = new user({
        username: "otherGuy",
        email: "other@test.com",
        password: "hashedPassword",
        firstName: "Other",
        lastName: "User",
      });
      dummyUser = await otherUser.save();
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

    const dummyUrl = new urlShortner({
      longUrl: "https://google.com",
      shortCode: TEST_SHORTCODE,
      creator: dummyUser._id,
      click: 0,
    });
    await dummyUrl.save();

    req["params"] = {
      shortCode: TEST_SHORTCODE,
    };

    req["userId"] = res.loadedUser;

    req.headers = {
      Authorization: `Bearer ${res.auth_token}`,
    };

    req.get = sinon
      .stub()
      .callsFake((name: string) => req.headers[name.toLowerCase()]);

    const next = sinon.spy();

    await getStats(req, {} as Response, next);

    expect(next.calledOnce).to.be.true;
    expect(next.firstCall.args[0]).to.have.property("statusCode", 403);
  });

  it("should yield an actual existing stat", async () => {
    // TODO by tomorrow
  });

  after(async () => {
    await user.deleteMany({});
    await urlShortner.deleteMany({});

    mongoose.disconnect();
  });
});
