import { Router } from "express";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import { deletePlaylist, getPlaylistInfo, getPlaylistVideos, getUserPlaylists, removeVideoFromPlaylist, saveToPlayList, updatePlaylist } from "../controllers/playlist.controller.js";

const router = Router();

router.route("/playlist/:playlistId").get(getPlaylistInfo);
router.route("/playlist-videos/:playlistId").get(getPlaylistVideos);


router.route("/").get(verifyJWT,getUserPlaylists)
router.route("/:playlistId?/:videoId").post(verifyJWT,saveToPlayList);
router.route("/:playlistId/:videoId").delete(verifyJWT,removeVideoFromPlaylist);
router.route("/:playlistId").delete(verifyJWT,deletePlaylist);
router.route("/update/:playlistId").patch(verifyJWT,updatePlaylist);

export default router;