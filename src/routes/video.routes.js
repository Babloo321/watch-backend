import { Router } from 'express';
import {
    deleteVideo,
    getAllVideos,
    getPubliVideos,
    getPrivateVideos,
    getVideoById,
    publishAVideo,
    togglePublishStatus,
    updateVideo,
} from "../controllers/video.controller.js"
import {verifyJWT} from "../middlewares/auth.middleware.js"
import {upload} from "../middlewares/multer.middleware.js"

const videorouter = Router();
videorouter.use(verifyJWT); // Apply verifyJWT middleware to all routes in this file

videorouter.route("/public-videos").get(getPubliVideos);
videorouter.route("/private-videos").get(getPrivateVideos);
videorouter
    .route("/")
    .get(getAllVideos)
    .post(
        upload.fields([
            {
                name: "videoFile",
                maxCount: 1,
            },
            {
                name: "thumbnail",
                maxCount: 1,
            },
            
        ]),
        publishAVideo
    );

    videorouter
    .route("/:videoId")
    .get(getVideoById)
    .delete(deleteVideo)
    .patch(upload.single("videoFile"), updateVideo);

    videorouter.route("/toggle/publish/:videoId").patch(togglePublishStatus);

export default videorouter;