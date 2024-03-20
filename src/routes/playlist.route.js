import { Router } from "express";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import { getPlaylistInfo, getPlaylistVideos, saveToPlayList } from "../controllers/playlist.controller.js";

const router = Router();

router.route("/playlist/:playlistId").get(getPlaylistInfo);
router.route("/playlist-videos/:playlistId").get(getPlaylistVideos);



router.route("/:playlistId?/:videoId").post(verifyJWT,saveToPlayList);


export default router;