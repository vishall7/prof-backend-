import { Router } from "express";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import { deleteVideoComment, getVideoComments, updateVideoComment, writeCommentOnVideo } from "../controllers/comment.controller.js";

const router = Router();

router.route("/all-comments/:video_id").get(getVideoComments);


router.route("/video/:videoId").post(verifyJWT,writeCommentOnVideo);
router.route("/comment/:commentId").patch(verifyJWT,updateVideoComment);
router.route("/comment/:commentId").delete(verifyJWT,deleteVideoComment);


export default router;