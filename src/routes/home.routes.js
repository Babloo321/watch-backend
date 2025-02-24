import { Router } from 'express'

import { getTrendingVideo, getHomeVidoes, getAllVideos } from '../controllers/shorts.controller.js'
const shortsAndTrandingRouter = Router()

shortsAndTrandingRouter.route("/home").get(getHomeVidoes);
shortsAndTrandingRouter.route("/trending").get(getTrendingVideo);
shortsAndTrandingRouter.route("/allVideos").get(getAllVideos);

export default shortsAndTrandingRouter;