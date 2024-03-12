import { Router } from "express";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import { toggleSubscribeAndUnsubscribe } from "../controllers/subscription.controller.js";

const router = Router();

router.route("/:username").post(verifyJWT,toggleSubscribeAndUnsubscribe);

export default router;