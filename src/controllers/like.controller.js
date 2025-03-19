import mongoose, { isValidObjectId } from "mongoose";
import Like from "../models/like.model.js";
import ApiError from "../utils/ApiError.js";
import ApiResponse from "../utils/ApiResponse.js";
import asyncHandler from "../utils/asyncHandler.js";
import User from '../models/user.model.js';
const togglerFunction = async (userId, videoId) => {
    if (!isValidObjectId(videoId)) {
        return { message: "Invalid video ID", action: "error" };
    }

    if (!isValidObjectId(userId)) {
        return { message: "Invalid user ID", action: "error" };
    }

    // Check if the like already exists
    const existingLike = await Like.findOneAndDelete({ video: videoId, likedBy: userId });

    if (existingLike) {
        return { message: "Video unliked successfully", action: "unlike" };
    }

    // Otherwise, create a new like
    const newLike = new Like({
        video: videoId,
        likedBy: userId,
    });

    await newLike.save();
    return { message: "Video liked successfully", action: "like" };
};

// Controller for toggling video likes
const toggleVideoLike = asyncHandler(async (req, res) => {
    const { videoId } = req.params;
    const userId = req.user?._id;

    if (!userId) {
        throw new ApiError(401, "Unauthorized: User ID not found");
    }

    const result = await togglerFunction(userId, videoId);

    if (result.action === "error") {
        return res.status(400).json(new ApiResponse(400, result, "Invalid request"));
    }

    return res.status(200).json(new ApiResponse(200, result, "Like status updated"));
});

const videoLikeState = asyncHandler(async (req, res) => {
    const { videoId } = req.params;
    const userId = req.user?._id;

    if (!videoId) {
        throw new ApiError(401, "No video ID found");
    }

    const existUser = await User.findById(userId);
    if (!existUser) throw new ApiError(401, "This user does not exist");

    const existLike = await Like.aggregate([
        {
            $match: {
                video: new mongoose.Types.ObjectId(videoId),
                likedBy: new mongoose.Types.ObjectId(userId)
            }
        }
    ]);

    if (existLike.length > 0) {
        return res.status(200).json(
            new ApiResponse(200,true,"Video is liked by the user"))
    } else {
        return res
        .status(200)
        .json(new ApiResponse(200,false,"Video is not liked by the user"));
    }
});

const getTotalLikes = asyncHandler(async (req, res) => {
  const { videoId } = req.params;

  // Validate videoId
  if (!isValidObjectId(videoId)) {
      throw new ApiError(400, "Invalid Video ID");
  }

  // Count likes for the given videoId
  const totalLikes = await Like.countDocuments({ video: videoId });

  return res.status(200).json(
      new ApiResponse(200, { totalLikes }, "Total likes fetched successfully")
  );
});

const toggleCommentLike = asyncHandler(async (req, res) => {
    const {commentId} = req.params
    //TODO: toggle like on comment
    const result = await toggllerFunction(req.user?._id,commentId,"comment");
    if(!result){
        throw new ApiError(500, "Something went wrong while liking comment")
    }
    return res
    .status(200)
    .json(
        new ApiResponse(200,result, "Comment like successfully")
    )
})

const toggleTweetLike = asyncHandler(async (req, res) => {
    const {tweetId} = req.params
    //TODO: toggle like on tweet
    const result = await toggllerFunction(req.user?._id,tweetId,"tweet");
        return res
        .status(200)
        .json(
            new ApiResponse(201,result, "Tweet like added successfully")
        )
    })

const getLikedVideos = asyncHandler(async (req, res) => {
    //TODO: get all liked videos
    const userId = req.user?._id
    const likedVideos = await Like.aggregate([
        {
            $match:{
                likedBy: new mongoose.Types.ObjectId(userId)
            }
        },
        {
            $lookup:{
                from:"videos",
                localField:"video",
                foreignField:"_id",
                as:"video",
                pipeline:[
                    {
                        $project:{
                            _id:0,
                            title:1,
                            videoFile:1
                        }
                    }
                ]
            }
        },
        {
            $unwind:"$video"
        },
        // {
        //     $addFields:{
        //         video:"$video"
        //     }
        // },
        {
            $project:{
                _id:0,
                video:1
            }
        }
    ]);
    if(!likedVideos){
        throw new ApiError(500, "Something went wrong while getting liked videos")
    }
    return res
    .status(200)
    .json(
        new ApiResponse(200,likedVideos, "Liked videos fetched successfully")
    )
})



export {
    toggleCommentLike,
    toggleTweetLike,
    toggleVideoLike,
    getLikedVideos,
    getTotalLikes,
    videoLikeState
}