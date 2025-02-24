import mongoose, {isValidObjectId} from "mongoose"
import Like from "../models/like.model.js"
import ApiError from "../utils/ApiError.js"
import ApiResponse from "../utils/ApiResponse.js"
import asyncHandler from "../utils/asyncHandler.js"

const toggllerFunction = async (userId, videoId,video) => {
    if(!isValidObjectId(videoId)){
        throw new ApiError(400, `Invalid ${video} Id`)
    }
    const existingLike = await Like.findOne({ [video]: videoId });
    if(existingLike){
        // If a like already exists, remove it
        await existingLike.remove();
        return {message:`${video} removed successfully`,action:`un${video}`}
    }
    const newLike = new Like({
        [video]:videoId,
        likedBy:userId
    })
    await newLike.save()
    return {message:`${video} added successfully`,action:`${video}`}
}

const toggleVideoLike = asyncHandler(async (req, res) => {
    const {videoId} = req.params
    //TODO: toggle like on video
   const userId = req.user?._id;
   const result = await toggllerFunction(userId,videoId,"video");
   return res
   .status(200)
   .json(
    new ApiResponse(200,result, "Video like successfully")
   )
})

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
    getLikedVideos
}