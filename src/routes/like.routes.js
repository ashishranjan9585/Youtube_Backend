import { Router } from "express";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import {
    getLikedVideos,
    toggleTweetLike,
    toggleCommentLike,
    toggleVideoLike
    
} from '../controllers/like.controller.js'

const router = Router();
router.use(verifyJWT);

router.route("/toggle-video/:videoid").post(toggleVideoLike);
router.route("/toggle-comment/:commentId").post(toggleCommentLike);
router.route("/toggle-tweet/:tweetId").post(toggleTweetLike);
router.route("/all-liked-video").get(getLikedVideos)

export default router;