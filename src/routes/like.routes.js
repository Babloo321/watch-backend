import { Router } from "express";
import { toggleVideoLike, getTotalLikes, videoLikeState } from "../controllers/like.controller.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";

const likeRouter = Router();
likeRouter.use(verifyJWT); // Apply JWT verification to all routes

// Corrected route path
likeRouter.route("/toggle-like/:videoId").patch(toggleVideoLike);
likeRouter.route("/total-like/:videoId").get(getTotalLikes);
likeRouter.route("/video-like-state/:videoId").get(videoLikeState);

export default likeRouter;
