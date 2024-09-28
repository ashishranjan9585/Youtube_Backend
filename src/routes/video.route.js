import { Router } from "express";
import { upload } from "../middlewares/multer.middleware.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import { getAllVideos, getVideoById, publishAVideo, togglePublishStatus, updateVideo } from "../controllers/video.controller.js";
const router = Router();

router.use(verifyJWT);

router.route("/").post(
    upload.fields([
        {
            name : "videoFile",
            maxCount : 1
        },
        {
            name : " thumbnail",
            maxCount : 1
        }
    ]),
    publishAVideo
);

router.route("/all-videos/:userId").get(getAllVideos);
router.route("/video-by-id/:videoId").get(getVideoById);
router.route("/update-video/:videoId").patch(upload.fields([
    {
        name : "thumbnail",
        maxCount : 1
    }
]), updateVideo)

router.route("/toggle/publish/:videoId").patch(togglePublishStatus);


export default router;