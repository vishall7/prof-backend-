import { Router } from "express";
import {registerUser, loginUser, logoutUser,refreshAccessToken,changeCurrentPassword,getCurrentUser,updateAccountDetails,updateUserAvatar,updateUserCoverImage, getUserChannelProfile, getUserWatchHistory, createTweet, getAllTweets} from "../controllers/user.controller.js";
import { upload } from "../middlewares/multer.middleware.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";


const router = Router();

router.route("/register").post(
    upload.fields([
        {
            name: "avatar",
            maxCount: 1
        },
        {
            name: "coverImage",
            maxCount: 1
        }
    ]),
    registerUser
    );

router.route("/login").post(loginUser)

router.route("/tweets").get(getAllTweets)

// secured routes
router.route("/logout").post(verifyJWT,logoutUser)
router.route("/refresh-token").post(refreshAccessToken)
router.route("/change-password").post(verifyJWT,changeCurrentPassword)
router.route("/get-user").get(verifyJWT,getCurrentUser)
router.route("/updateAccountDetails").patch(verifyJWT,updateAccountDetails)
router.route("/updateUserAvatar").patch(
    verifyJWT,
    upload.single("avatar"),
    updateUserAvatar
)
router.route("/updateUserCoverImage").patch(
    verifyJWT,
    upload.single("coverImage"),
    updateUserCoverImage
)

router.route("/channel/:username").get(verifyJWT,getUserChannelProfile);

router.route("/watch-history").get(verifyJWT,getUserWatchHistory);

router.route("/create-tweet").post(verifyJWT,createTweet)


export default router;


