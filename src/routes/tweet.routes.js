import { Router } from 'express';
import {
    createTweet,
    deleteTweet,
    getUserTweets,
    updateTweet,
} from "../controllers/tweet.controller.js"
import {verifyJWT} from "../middlewares/auth.middleware.js"

const tweetRouter = Router();
tweetRouter.use(verifyJWT); // Apply verifyJWT middleware to all routes in this file

tweetRouter.route("/create").post(createTweet);
tweetRouter.route("/tweet/:userId").get(getUserTweets);
tweetRouter.route("/update/:tweetId").patch(updateTweet)
tweetRouter.route("/delete/:tweetId").delete(deleteTweet);
tweetRouter.route("/:tweetId").patch(updateTweet).delete(deleteTweet);

export default tweetRouter