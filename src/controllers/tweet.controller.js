import mongoose, { isValidObjectId, mongo } from "mongoose";
import Tweet from "../models/tweet.model.js";
import User from "../models/user.model.js";
import ApiError from "../utils/ApiError.js";
import ApiResponse from "../utils/ApiResponse.js";
import asyncHandler from "../utils/asyncHandler.js";

const createTweet = asyncHandler(async (req, res) => {
  //TODO: create tweet
  // data nikalenge req.body me se fir tweet create karenge
  // database me save kar denge
  const { content } = req.body;
  if (!content) {
    throw new ApiError(400, "Content is required");
  }
  const user = await User.findById(req.user?._id);
  if (!user) {
    throw new ApiError(404, "User not Exists!");
  }
  const tweet = await Tweet.create({ content, owner: user._id });
  if (!tweet) {
    throw new ApiError(500, "Something went wrong while creating tweet");
  }

  console.log("Tweet Created successfully");
  return res
    .status(200)
    .json(new ApiResponse(200, { tweet }, "Tweet created Successfully"));
});

const getUserTweets = asyncHandler(async (req, res) => {
  // TODO: get user tweets
  // sbse pehle userId get karenge req.params se
  // database me us user ko find karenge uska tweet fetch karenge
  let userId = req.params.userId;
  if (!isValidObjectId(userId)) {
    throw new ApiError(400, "Invalid user id");
  }

  // find tweet into database
  const tweet = await Tweet.find({ owner: userId });
  if (!tweet) {
    throw new ApiError(404, "User not found");
  }

  console.log("Tweet Fetched successfully");
  return res
    .status(200)
    .json(
      new ApiResponse(200, tweet[0]?.content, "Tweets fetched Successfully")
    );
});

const updateTweet = asyncHandler(async (req, res) => {
  //TODO: update tweet
  let tweetId = req.params?.tweetId;
  let _id=new mongoose.Types.ObjectId(tweetId)
  const { newTweet } = req.body;

  if(!newTweet){
    throw new ApiError(400, "Tweet is required")
  }

  const tweet = await Tweet.findByIdAndUpdate(
    _id,
    { content: newTweet },
    { new: true },
    
  );

  if (!tweet) {
    throw new ApiError(404, "Tweet not found");
  }

  console.log("Tweet updated successfully");
  return res
    .status(200)
    .json(new ApiResponse(200, tweet, "Tweet updated Successfully"));
});

const deleteTweet = asyncHandler(async (req, res) => {
  //TODO: delete tweet
  let tweetId = req.params?.tweetId;
  let _id=new mongoose.Types.ObjectId(tweetId)
  const tweet = await Tweet.findByIdAndDelete(_id);

  if (!tweet) {
    throw new ApiError(404, "Tweet not found");
  }

  console.log("Tweet Deleted successfully");
  return res
    .status(200)
    .json(new ApiResponse(200, {}, "Tweet Deleted Successfully"));
});

export { createTweet, getUserTweets, updateTweet, deleteTweet };
