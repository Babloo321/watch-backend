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
    incrementViews,
    decrementViews,
    querySearchVideo,
    channelPrivateVideo,
    channelPublicVideo,
    getRandomVideosWithoutToken
} from "../controllers/video.controller.js"
import {verifyJWT} from "../middlewares/auth.middleware.js"
import {upload} from "../middlewares/multer.middleware.js"

const videorouter = Router();
// export const videoWithoutToken = Router().route("/without-token").get(getRandomVideosWithoutToken);
// videoWithoutToken.route("/without-token").get(getRandomVideosWithoutToken);
videorouter.use(verifyJWT); // Apply verifyJWT middleware to all routes in this file

videorouter.route("/public-videos").get(getPubliVideos);
videorouter.route("/private-videos").get(getPrivateVideos);
videorouter.route("/increment-views/:videoId").patch(incrementViews);
videorouter.route("/decrement-views/:videoId").patch(decrementViews);
videorouter.route("/query-search-result").get(querySearchVideo);
videorouter.route("/increment-views/:videoId").patch(incrementViews);
videorouter.route("/channel-public-video/:userId").get(channelPublicVideo);
videorouter.route("/channel-private-video/:userId").get(channelPrivateVideo);
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
    .patch(upload.single("thumbnail"), updateVideo);

    videorouter.route("/toggle/publish/:videoId").patch(togglePublishStatus);
    export default videorouter