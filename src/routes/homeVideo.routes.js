import { Router } from 'express';
import { getRandomVideosWithoutToken } from '../controllers/video.controller.js';

const videoRouteWithoutToken = Router();

// Route to fetch videos without authentication
videoRouteWithoutToken.route("/").get(getRandomVideosWithoutToken);

export default videoRouteWithoutToken;
