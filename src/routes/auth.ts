import { Router } from "express";
import { login, signUp } from "../controllers/auth.js";
import { body } from "express-validator";
import user from "../models/user.js";

const AuthRouter = Router();

AuthRouter.post(
  "/sign-up",
  [
    body("firstName")
      .exists()
      .withMessage("First name is required")
      .trim()
      .isLength({ min: 3 })
      .withMessage("First name must be at least 3 characters"),
    body("lastName")
      .exists()
      .withMessage("Last name is required")
      .trim()
      .isLength({ min: 3 })
      .withMessage("Last name must be at least 3 characters"),
    body("password")
      .exists()
      .withMessage("Password is required")
      .trim()
      .isLength({ min: 8 })
      .withMessage("Password must be at least 8 characters"),
    body("email")
      .exists()
      .withMessage("Emaiil is required")
      .isEmail()
      .normalizeEmail()
      .withMessage("Please enter a valid email")
      .custom(async (value, { req }) => {
        return user.findOne({ email: value }).then((userDoc) => {
          if (userDoc) {
            return Promise.reject("E-Mail address already exists!");
          }
        });
      }),
    body("username")
      .exists()
      .withMessage("Username is required")
      .trim()
      .toLowerCase()
      .isLength({ min: 3 })
      .custom((value) => {
        if (value === "settings" || value === "home") {
          throw new Error('Username cannot be "settings" or "home"');
        }
        return true;
      })
      .custom((value, { req }) => {
        return user.findOne({ username: value }).then((userDoc) => {
          if (userDoc) {
            return Promise.reject("Username already exists!");
          }
        });
      }),
  ],
  signUp,
);

AuthRouter.post(
  "/login",
  [
    body("username")
      .exists()
      .withMessage("Username is required")
      .trim()
      .toLowerCase()
      .isLength({ min: 3 })
      .withMessage("username must be at least 8 characters"),
    body("password")
      .exists()
      .withMessage("Password is required")
      .trim()
      .isLength({ min: 8 })
      .withMessage("Password must be at least 8 characters"),
  ],
  login,
);

export default AuthRouter;
