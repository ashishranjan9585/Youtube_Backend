import { Router } from "express";
import {
    getAllTweets,
    deleteTweet,
    updateTweet,
    getUserTweets,
    createTweet 
} from '../controllers/tweet.controller.js';
import { verifyJWT } from "../middlewares/auth.middleware.js";

const router = Router();

router.use(verifyJWT);

router.route("/create-tweet").post(createTweet);
router.route("/get-tweet/:userid").get(getUserTweets);
router.route("/getAll-tweet").get(getAllTweets);
router.route("/update-tweet/:tweetid").patch(updateTweet);
router.route("/delete-tweet/:tweetid").delete(deleteTweet);

export default router;