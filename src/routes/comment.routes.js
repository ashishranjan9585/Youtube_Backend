import {Router} from 'express';
import { verifyJWT } from "../middlewares/auth.middleware.js";
import { getVideoComments ,
        addComment,
        deleteComment,
        updateComment
} from '../controllers/comment.controller.js';

const router = Router();

router.use(verifyJWT); 

router.route("/get-video-comments/:videoId").get(getVideoComments);
router.route("/add-comment/:videoId").post(addComment);
router.route("/delete-comment/:commentid").delete(deleteComment);
router.route("/update-comment/:commentid").patch(updateComment)

export default router