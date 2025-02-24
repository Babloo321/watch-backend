import mongoose, { mongo } from "mongoose"
import Video from "../models/video.model.js"
import Subscription from "../models/subscription.model.js"
import Like from "../models/like.model.js"
import ApiError from "../utils/ApiError.js"
import ApiResponse from "../utils/ApiResponse.js"
import asyncHandler from "../utils/asyncHandler.js"

const getChannelStats = asyncHandler(async (req, res) => {
    // TODO: Get the channel stats like total video views, total subscribers, total videos, total likes etc.
    if(!req.user){
        throw new ApiError(401, "Unauthorized Request");
    }
    const userId = req.user?._id;
    const subscriberPipeline =   [
        {
            $match:{
                subscriber:new mongoose.Types.ObjectId(userId)
            }
        },
        {
            $group:{
                _id:null,
                total:{$sum:1}
            }
        },
        {
            $project:{
                total:1,
                _id:0
            }
        }
    ]
    const videoPipeline = [
        {
            $match:{
                owner:new mongoose.Types.ObjectId(userId)
            }
        },
        {
            $unwind:"$videoFile"
        },
        {
            $group:{
                _id:"$owner",
                videos:{$push:"$videoFile"},
                count:{$sum:1}
            }
        },
        {
            $project:{
                videos:1,
                _id:0,
                count:1
            }
        }
    ]
    const likePipeline =  [
        {
            $match:{
                likedBy:new mongoose.Types.ObjectId(userId)
            }
        },
        {
            $group:{
                _id:"$likedBy",
                total:{$sum:1}
            }
        },
        {
            $project:{
                total:1,
                _id:0
            }
        }
    ]
    const totalVideosViews =  [
        {
            $match:{
                owner:new mongoose.Types.ObjectId(userId)
            }
        },
        {
            $unwind:"$videoFile"
        },
        {
            $group:{
                _id:"$owner",
                total:{$sum:"$views"}
            }
        },
        {
            $project:{
                total:1,
                _id:0
            }
        }
    ]
    const totalSubscribers = await Subscription.aggregate(subscriberPipeline)
    const totalVideos = await Video.aggregate(videoPipeline);
    const totalLikes = await Like.aggregate(likePipeline);
    const totalVideoViews = await Video.aggregate(totalVideosViews)
    const dashboardData = {
        totalSubscribers:totalSubscribers[0]?.total || 0,
        totalVideos:totalVideos[0]?.count || 0,
        totalLikes:totalLikes[0]?.total || 0,
        totalVideoViews:totalVideoViews[0]?.total || 0
    }
   if(!dashboardData){
    throw new ApiError(501, "Getting error while fetching data from database");
   }
   return res
   .status(200)
   .json(
    new ApiResponse(200, dashboardData, "Fetching dashboard data successfully")
   )
})

const getChannelVideos = asyncHandler(async (req, res) => {
    // TODO: Get all the videos uploaded by the channel
    const userId = req.user?._id;
    const channelTotalVideos = await Subscription.aggregate([
        {
            $match: {
                channel: new mongoose.Types.ObjectId(userId)
            }
        },
        {
            $lookup: {
                from: "videos",
                localField: "channel",
                foreignField: "owner",
                as: "videos"
            }
        },
        {
            $unwind: "$videos"
        },
        {
            $group: {
                _id: {
                    videoFile: "$videos.videoFile",
                    thumbnail: "$videos.thumbnail",
                    title: "$videos.title",
                    description: "$videos.description",
                    views: "$videos.views"
                }
            }
        },
        {
            $project: {
                _id: 0,
                videoFile: "$_id.videoFile",
                thumbnail: "$_id.thumbnail",
                title: "$_id.title",
                description: "$_id.description",
                views: "$_id.views"
            }
        }
    ]);
    if(!channelTotalVideos){
        throw new ApiError(501, "Getting error while fetching data from database");
    }
    return res
    .status(200)
    .json(
        new ApiResponse(200, channelTotalVideos, "Fetching dashboard data successfully")
    )
})

export {
    getChannelStats, 
    getChannelVideos
    }