import { Router } from "express";
import { deleteVideo, getAllVideos, getVideoById, updateVideoDetails, uploadVideo } from "../controllers/video.controller.js";
import { upload } from "../middlewares/multer.middleware.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import { updateAccountDetails } from "../controllers/user.controller.js";

const router = Router();

router.route("/videoById/:videoId").get(getVideoById)




//safe routes
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
router.route("/get-videos").get(verifyJWT,getAllVideos)

router.route("/update-video-details/:videoId").patch(verifyJWT,updateVideoDetails)

router.route("/delete-video/:videoId").delete(verifyJWT,deleteVideo);

export default router;

