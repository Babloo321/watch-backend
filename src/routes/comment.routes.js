import { Router } from "express";
import { addComment, getVideoComments } from '../controllers/comment.controller.js';
import { verifyJWT } from "../middlewares/auth.middleware.js";

const commentRouter = Router();
commentRouter.use(verifyJWT); // Apply JWT verification to all routes

// Corrected route path
commentRouter.route("/create-comment/:videoId").post(addComment);
commentRouter.route("/video-comment/:videoId").get(getVideoComments);

export default commentRouter;
