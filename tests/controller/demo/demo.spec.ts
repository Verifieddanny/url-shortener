import { expect } from "../../setup.js";
import dotenv from "dotenv";
import * as sinon from "sinon";
import type { IUser } from "../../../src/models/user.js";
import { mongooseConnect } from "../../shared/before-hook.js";
import type { AuthRequest } from "../../../src/shared/types.js";
import type { TestResponse } from "../auth/auth-type.js";
import { openUrl, shortenUrl } from "../../../src/controllers/demo.js";
import demo from "../../../src/models/demo.js";
import type { Request, Response } from "express";

describe("Demo Controller", () => {
  before(async () => {
    await mongooseConnect();
    await demo.deleteMany({});
  });

  it("should create a shortened url", async () => {
    const req = {
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
      json(data: { message: string; _newUrl: string; _expiresAt: string }) {
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
      "demo url created",
    );
  });

  it("should return status code 200 for existing url with a message url exits", async () => {
    const newUrl = new demo({
      longUrl: "https://google.com/ggte",
      shortCode: "test-code",
    });

    await newUrl.save();

    const req = {
      body: {
        url: "https://google.com/ggte",
      },
    } as AuthRequest;

    const res = {
      statusCode: 500,
      message: "",
      status(code) {
        this.statusCode = code;
        return this;
      },
      json(data: { message: string; _url: string }) {
        this.message = data.message;
        return this;
      },
    } as TestResponse;

    res.json = sinon.spy();

    await shortenUrl(req, res, () => {});

    expect(res.statusCode).to.be.equals(200);
    expect(res.json.calledOnce).to.be.true;
    expect(res.json.firstCall.args[0]).to.have.property("message", "url exist");
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

  it("should return 410 when link has expired", async () => {
    const lastYear = new Date();
    lastYear.setFullYear(lastYear.getFullYear() - 1);

    const newUrl = new demo({
      longUrl: "https://google.com/410",
      shortCode: "new-test-code",
      expiresAt: lastYear,
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

    expect(res.statusCode).to.be.equals(410);
    expect((res.send as sinon.SinonSpy).calledOnce).to.be.true;
    expect((res.send as sinon.SinonSpy).firstCall.args[0]).to.equal(
      "This resource is permanently gone.",
    );
  });

  it("should return 301 status code", async () => {
    const newUrl = new demo({
      longUrl: "https://google.com/301",
      shortCode: "new-test",
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
});
