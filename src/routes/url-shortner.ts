import { Router } from "express";
import { body } from "express-validator";
import { getAll, shortenUrl } from "../controllers/urlShortner.js";
import { isAuth } from "../middleware/is-auth.js";
import { getStats } from "../controllers/auth.js";
import urlShortner from "../models/url-shortner.js";

const urlShortnerRouter = Router();

urlShortnerRouter.post(
  "/shortner",
  isAuth,
  [
    body("url").isURL().withMessage("Input a valid url"),
    body("customCode")
      .optional({ checkFalsy: true })
      .isLength({ min: 3 })
      .withMessage("Must be at least 3 chars")
      .custom((value) => {
        return urlShortner.findOne({ shortCode: value }).then((doc) => {
          if (doc) {
            return Promise.reject("Slug already exists");
          }
        });
      }),
    body("expiresAt").optional({ nullable: true }).isISO8601().toDate(),
  ],
  shortenUrl,
);

urlShortnerRouter.get("/:shortCode", isAuth, getStats);

urlShortnerRouter.get("/urls/all", isAuth, getAll);

export default urlShortnerRouter;
