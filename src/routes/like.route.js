import { Router } from "express";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import { toggleLikeAndUnlikeComment, toggleLikeAndUnlikeVideo } from "../controllers/like.controller.js";

const router = Router();

router.route("/video/:videoId").post(verifyJWT,toggleLikeAndUnlikeVideo);
router.route("/comment/:commentId").post(verifyJWT,toggleLikeAndUnlikeComment);


export default router;