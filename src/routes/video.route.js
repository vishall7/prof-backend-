import { Router } from "express";
import { deleteVideo, getAllVideos, getVideoById, updateVideoDetails, uploadVideo } from "../controllers/video.controller.js";
import { upload } from "../middlewares/multer.middleware.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";

const router = Router();

//safe routes

router.route("/videoById/:videoId").get(verifyJWT,getVideoById)

router.route("/upload-video").post(
    verifyJWT,
    upload.fields(
        [
            {
                name: "video",
                maxCount: 1
            },
            {
                name: "thumbnail",
                maxCount: 1
            }
        ]
    ),
    uploadVideo
)
//this routes also safe because it contains user info
router.route("/get-videos").get(getAllVideos)

router.route("/update-video-details/:videoId").patch(verifyJWT,updateVideoDetails)

router.route("/delete-video/:videoId").delete(verifyJWT,deleteVideo);

export default router;

