import type { NextFunction, Request, Response } from "express";
import { validationResult } from "express-validator";
import type { CustomError, AuthRequest } from "../shared/types.js";
import { nanoid } from "nanoid";
import urlShortner from "../models/url-shortner.js";
import user from "../models/user.js";

export const shortenUrl = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction,
) => {
  try {
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
      console.log(errors.array());
      const error: CustomError = new Error(
        "Validation failed, entered data is incorrect.",
      );
      error.statusCode = 422;
      error.data = errors.array();
      throw error;
    }

    const url = req.body.url;
    const customCode = req.body.customCode;
    const expiresAt = req.body.expiresAt;
    const userId = req.userId;

    const urlExists = await urlShortner.findOne({
      longUrl: url,
    });

    if (
      urlExists &&
      (!urlExists.expiresAt || new Date(urlExists.expiresAt) > new Date())
    ) {
      return res.status(200).json({
        message: "shortened url exits",
        url: `${process.env.BASE_URL || "http://localhost:8080"}/${urlExists.shortCode}`,
      });
    }

    const generatedCode = customCode ? customCode : nanoid(8);

    const urlLink = new urlShortner({
      longUrl: url,
      shortCode: generatedCode,
      creator: userId,
      expiresAt: expiresAt || null,
    });

    const savedUrlLink = await urlLink.save();
    const creator = await user.findById(userId);

    res.status(201).json({
      message: "Shortend Url generated",
      newUrl: `${process.env.BASE_URL || "http://localhost:8080"}/${savedUrlLink.shortCode}`,
      creatorData: {
        _id: creator?._id,
        username: creator?.username,
      },
      expiresAt: expiresAt || null,
    });
  } catch (error) {
    const err = error as CustomError;
    if (!err.statusCode) {
      err.statusCode = 500;
    }
    next(err);
  }
};

export const openUrl = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const shortCode = req.params.shortCode || "";

    const LinkedUrl = await urlShortner.findOneAndUpdate(
      { shortCode },
      { $inc: { click: 1 } },
      { after: true },
    );

    if (!LinkedUrl) {
      const error: CustomError = new Error("Link doesn't exist");
      error.statusCode = 404;
      throw error;
    }

    if (LinkedUrl.expiresAt && new Date(LinkedUrl.expiresAt) < new Date()) {
      return res.status(410).send("This resource is permanently gone.");
    }

    res.status(301).redirect(LinkedUrl.longUrl);
  } catch (error) {
    const err = error as CustomError;
    if (!err.statusCode) {
      err.statusCode = 500;
    }

    next(err);
  }
};

export const getAll = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction,
) => {
  try {
    const userId = req.userId;

    const urls = await urlShortner.find({ creator: userId });
    const total = await urlShortner.find({ creator: userId }).countDocuments();

    res.status(200).json({
      message: total > 0 ? "URLs fetched" : "No URL Shortened",
      total: total,
      urls: urls,
    });
  } catch (error) {
    const err = error as CustomError;
    if (!err.statusCode) {
      err.statusCode = 500;
    }

    next(err);
  }
};
