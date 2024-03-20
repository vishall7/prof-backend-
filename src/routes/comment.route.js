import { Router } from "express";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import { addReplyToComment, deleteVideoComment, getCommentReplies, getVideoComments, updateVideoComment, writeVideoComment } from "../controllers/comment.controller.js";

const router = Router();

router.route("/all-comments/:video_id").get(getVideoComments);
router.route("/comment-replies/:commentId").get(getCommentReplies);

router.route("/video/:videoId").post(verifyJWT,writeVideoComment);
router.route("/:commentId").post(verifyJWT,addReplyToComment);
router.route("/comment/:commentId").patch(verifyJWT,updateVideoComment);
router.route("/comment/:commentId").delete(verifyJWT,deleteVideoComment);


export default router;