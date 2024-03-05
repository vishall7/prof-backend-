import { Router } from "express";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import { getAllTweets,createTweet } from "../controllers/tweet.controller.js";



const router = Router();

router.route("/create-tweet").post(verifyJWT,createTweet);
router.route("/alltweets").get(getAllTweets);

export default router;