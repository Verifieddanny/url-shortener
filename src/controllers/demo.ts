import type { NextFunction, Request, Response } from "express";
import { validationResult } from "express-validator";
import type { CustomError } from "../shared/types.js";
import { nanoid } from "nanoid";
import demo from "../models/demo.js";

export const shortenUrl = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
      const error: CustomError = new Error(
        "Validation failed, entered data is incorrect.",
      );
      error.statusCode = 422;
      error.data = errors.array();

      throw error;
    }

    const url = req.body.url;

    const urlExists = await demo.findOne({
      longUrl: url,
    });

    if (urlExists && new Date(urlExists.expiresAt) > new Date()) {
      return res.status(200).json({
        message: "url exist",
        url: `${process.env.BASE_URL || "http://localhost:8080"}/demo/${urlExists.shortCode}`,
      });
    }

    const generatedCode = nanoid(5);

    const urlLink = new demo({
      longUrl: url,
      shortCode: generatedCode,
    });

    const savedLink = await urlLink.save();

    res.status(201).json({
      message: "demo url created",
      url: `${process.env.BASE_URL || "http://localhost:8080/demo"}/${savedLink.shortCode}`,
      expiresAt: savedLink.expiresAt.toISOString(),
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

    const LinkedUrl = await demo.findOne({
      shortCode,
    });

    if (!LinkedUrl) {
      const error: CustomError = new Error("Link doesn't exist");
      error.statusCode = 404;
      throw error;
    }

    if (new Date(LinkedUrl.expiresAt) < new Date()) {
      // return res.status(410).send("This resource is permanently gone.");
      return res.status(301).redirect("http//localhost:5173/?expired=true");
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
