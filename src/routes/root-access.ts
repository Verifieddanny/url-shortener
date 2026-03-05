import { Router } from "express";
import { openUrl } from "../controllers/urlShortner.js";

const rootAccessRouter = Router();

rootAccessRouter.get("/:shortCode", openUrl);


export default rootAccessRouter;
