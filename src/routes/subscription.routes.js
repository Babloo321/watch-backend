import { Router } from "express";
import { toggleSubscription, getUserChannelSubscribers, getCurrentUserSubscriptions } from "../controllers/subscription.controller.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";

const subscriptionRouter = Router();
subscriptionRouter.use(verifyJWT); // Apply JWT verification to all routes

// Corrected route path
subscriptionRouter.route("/toggle-subscription/:channeld").patch(toggleSubscription);
subscriptionRouter.route("/total-subscriber/:channelId").get(getUserChannelSubscribers);
subscriptionRouter.route("/total-subscriptions").get(getCurrentUserSubscriptions);

export default subscriptionRouter;