import { Router } from "express";
import { body } from "express-validator";
import { openUrl, shortenUrl } from "../controllers/demo.js";

const demoRouter = Router();

demoRouter.post(
  "/shorten",
  [body("url").isURL().withMessage("Input a valid url")],
  shortenUrl,
);

demoRouter.get("/:shortCode", openUrl);

export default demoRouter;
