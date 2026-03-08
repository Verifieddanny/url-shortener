import { expect } from "../../setup.js";
import dotenv from "dotenv";
import * as sinon from "sinon";
import type { IUser } from "../../../src/models/user.js";
import { mongooseConnect } from "../../shared/before-hook.js";
import type { AuthRequest } from "../../../src/shared/types.js";
import type { TestResponse } from "../auth/auth-type.js";
import {
  getAll,
  openUrl,
  shortenUrl,
} from "../../../src/controllers/urlShortner.js";
import urlShortner from "../../../src/models/url-shortner.js";
import type { Request, Response } from "express";

dotenv.config();

describe("Url Shortner Controller", () => {
  let testUser: IUser;
  before(async () => {
    const result = await mongooseConnect();
    testUser = result.testUser;
  });

  it("should create a shortened url", async () => {
    const req = {
      userId: testUser._id.toString(),
      body: {
        url: "https://google.com",
      },
    } as AuthRequest;

    const res = {
      statusCode: 500,
      message: "",
      status(code) {
        this.statusCode = code;
        return this;
      },
      json(data: { message: string; _creatorData: {}; _expiresAt: string }) {
        this.message = data.message;
        return this;
      },
    } as TestResponse;

    res.json = sinon.spy();

    await shortenUrl(req, res, () => {});

    expect(res.statusCode).to.be.equals(201);
    expect(res.json.calledOnce).to.be.true;
    expect(res.json.firstCall.args[0]).to.have.property(
      "message",
      "Shortend Url generated",
    );
  });

  it("should return status code 200 for existing url with a message shortened url exits", async () => {
    const newUrl = new urlShortner({
      longUrl: "https://google.com",
      shortCode: "test-code",
      creator: testUser._id.toString(),
    });

    await newUrl.save();

    const req = {
      userId: testUser._id.toString(),
      body: {
        url: "https://google.com",
      },
    } as AuthRequest;

    const res = {
      statusCode: 500,
      message: "",
      status(code) {
        this.statusCode = code;
        return this;
      },
      json(data: { message: string; _creatorData: {}; _expiresAt: string }) {
        this.message = data.message;
        return this;
      },
    } as TestResponse;

    res.json = sinon.spy();

    await shortenUrl(req, res, () => {});

    expect(res.statusCode).to.be.equals(200);
    expect(res.json.calledOnce).to.be.true;
    expect(res.json.firstCall.args[0]).to.have.property(
      "message",
      "shortened url exits",
    );
  });

  it("should return 404 error when opening unknown url", async () => {
    const req = {
      params: {
        shortCode: "invalid-code",
      },
    } as unknown as Request & { params: { shortCode: string } };

    const next = sinon.spy();

    await openUrl(req, {} as Response, next);

    expect(next.calledOnce).to.be.true;
    expect(next.firstCall.args[0]).to.have.property("statusCode", 404);
  });

  it("should return 410(now 302 for FE Integration) when link has expired", async () => {
    const lastYear = new Date();
    lastYear.setFullYear(lastYear.getFullYear() - 1);

    const newUrl = new urlShortner({
      longUrl: "https://google.com",
      shortCode: "new-test-code",
      expiresAt: lastYear,
      creator: testUser._id.toString(),
    });

    await newUrl.save();

    const req = {
      params: {
        shortCode: "new-test-code",
      },
    } as unknown as Request & { params: { shortCode: string } };

    const res = {
      statusCode: 500,
      message: "",
      status(code) {
        this.statusCode = code;
        return this;
      },
      send(data: string) {
        this.message = data;
        return this;
      },
    } as TestResponse;

    res.send = sinon.spy(res, "send");

    await openUrl(req, res, () => {});

    expect(res.statusCode).to.be.equals(302);
    // expect((res.send as sinon.SinonSpy).calledOnce).to.be.true;
    // expect((res.send as sinon.SinonSpy).firstCall.args[0]).to.equal(
    //   "This resource is permanently gone.",
    // );
  });

  it("should return 301 status code", async () => {
    const newUrl = new urlShortner({
      longUrl: "https://google.com",
      shortCode: "new-test",
      creator: testUser._id.toString(),
    });

    await newUrl.save();

    const req = {
      params: {
        shortCode: "new-test",
      },
    } as unknown as Request & { params: { shortCode: string } };

    const res = {
      statusCode: 500,
      status(code) {
        this.statusCode = code;
        return this;
      },
    } as TestResponse;

    await openUrl(req, res, () => {});

    expect(res.statusCode).to.be.equals(301);
  });

  it("should return URLs fetched", async () => {
    const req = {
      userId: testUser._id.toString(),
    } as AuthRequest;

    const res = {
      statusCode: 500,
      message: "",
      status(code) {
        this.statusCode = code;
        return this;
      },
      json(data: { message: string; total: number; urls: string[] }) {
        this.data = data;
        this.message = data.message;
      },
    } as TestResponse;

    res.json = sinon.spy();

    await getAll(req, res, () => {});

    expect(res.json.calledOnce).to.be.true;
    expect(res).to.have.property("statusCode", 200);
    expect(res.json.firstCall.args[0]).to.have.property(
      "message",
      "URLs fetched",
    );
  });

  it("should return No URL Shortened", async () => {
    await urlShortner.deleteMany({});
    const req = {
      userId: testUser._id.toString(),
    } as AuthRequest;

    const res = {
      statusCode: 500,
      message: "",
      status(code) {
        this.statusCode = code;
        return this;
      },
      json(data: { message: string; total: number; urls: string[] }) {
        this.data = data;
        this.message = data.message;
      },
    } as TestResponse;

    res.json = sinon.spy();

    await getAll(req, res, () => {});

    expect(res.json.calledOnce).to.be.true;
    expect(res).to.have.property("statusCode", 200);
    expect(res.json.firstCall.args[0]).to.have.property(
      "message",
      "No URL Shortened",
    );
  });
});
