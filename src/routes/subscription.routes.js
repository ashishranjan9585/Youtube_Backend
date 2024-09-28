import { Router } from "express";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import {
    getSubscribedChannels,
    getUserChannelSubscribers,
    toggleSubscription
    } from "../controllers/subscription.controller.js"

const router = Router();
router.use(verifyJWT);

router.route("/toggle-subs/:channalId").post(toggleSubscription);
router.route("/channal-subs/:channalId").get(getUserChannelSubscribers);
router.route("/subs-channal/:subscribedId").get(getSubscribedChannels);

export default router;