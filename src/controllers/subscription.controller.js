import mongoose, {isValidObjectId} from "mongoose"
import User from "../models/user.model.js"
import Subscription from "../models/subscription.model.js"
import ApiError from "../utils/ApiError.js"
import ApiResponse from "../utils/ApiResponse.js"
import asyncHandler from "../utils/asyncHandler.js"


const toggleSubscription = asyncHandler(async (req, res) => {
    let {channelId} = req.params
    channelId = new mongoose.Types.ObjectId(channelId)
    let userId = req.user?._id
    const { name, details } = req.body
    if(!(name || details)) {
        throw new ApiError(400, "All fields are required")
    }


    // TODO: toggle subscription
    if(!isValidObjectId(channelId)){
        throw new ApiError(400, "Invalid Channel Id")
    }

    console.log("userId=channelId: ", userId,channelId)

    if(channelId.equals(userId)){
        throw new ApiError(400, "You cannot subscribe to yourself")
    }

    const exsitChannel = await User.findById(channelId);
    if(exsitChannel){
        const existSubscription = await Subscription.findOne({
            $and:[
                {subscriber:channelId},
                {channel:userId}
            ]
        })

        if(existSubscription){
            await Subscription.findByIdAndDelete(existSubscription._id)
            console.log("Unsubscribed channel");
            return res
            .status(200)
            .json(new ApiResponse(200, {}, "Unsubscribed Successfully"))
        }else {
            const subscription = await Subscription.create({
                subscriber: channelId,
                channel: userId,
                name:name.trim().toLowerCase(),
                details:details.trim().toLowerCase()
            })
            await subscription.save()
            console.log("subscription: ", subscription);
            return res
            .status(200)
            .json(new ApiResponse(200, subscription, "Subscribed Successfully"))
        }
    }else{
        throw new ApiError(400, "Channel not exists Please provide a valid channel");
    }
})

// controller to return subscriber list of a channel
const getUserChannelSubscribers = asyncHandler(async (req, res) => {
    const {channelId} = req.params

    if(!isValidObjectId(channelId)){
        throw new ApiError(400, "Invalid Channel Id")
    }

    const subscribers = await Subscription.aggregate([
        {
            $match:{
                channel: new mongoose.Types.ObjectId(channelId)
            }
        },
    {
        $lookup:{
            from:"users",
            localField:"subscriber",
            foreignField:"_id",
            as:"subscribers",
            pipeline:[
                {
                    $project:{
                        fullName:1,
                        avatar:1,
                        userName:1,
                        _id:0,
                        avatar:1,
                        coverImage:1
                    }
                },
                // {
                //     $addFields:{
                //         subscribersCount:{$count:"$subscribers"},
                //         channelDetails:{$arrayElemAt:["$subscribers",0]}
                //     }
                // }
            ]
        }
    },
    {
        $unwind:"$subscribers"
    },
    {
        $project:{
            // subscribers:1,
            subscribers:1,
            name:1,
            createdAt:1,
            _id:0
        }
    }
    ])


    if(!subscribers?.length){
        throw new ApiError(400, "You are not subscribed to any channel")
    }

    return res
    .status(200)
    .json(
        new ApiResponse(200, subscribers, "Subscribed Channels")
    )


})

// controller to return channel list to which user has subscribed
const getSubscribedChannels = asyncHandler(async (req, res) => {
    const { channelId } = req.params
    if(!isValidObjectId(channelId)){
        throw new ApiError(400, "Invalid Subscriber Id")
    }

    const subscribedChannels = await Subscription.aggregate([
        {
            $match:{
                subscriber: new mongoose.Types.ObjectId(channelId)
            }
        },
        {
            $lookup:{
                from: "users",
                localField: "channel",
                foreignField: "_id",
                as: "subscribedChannels",
                pipeline:[
                    {
                        $project:{
                            fullName:1,
                            avatar:1,
                            userName:1,
                            _id:0,
                            avatar:1,
                            coverImage:1
                        }
                    },
                   
                ]
            }
        },
        {
            $unwind:"$subscribedChannels"
        },
        {
            $project:{
                _id:0,
                name:1,
                // subscribers:1,
                subscribedChannels:1,
                createdAt:1
            }
        }
    ])

    if(!subscribedChannels?.length){
        throw new ApiError(400, "You are not subscribed to any channel")
    }

    return res
    .status(200)
    .json(
        new ApiResponse(200, subscribedChannels, "Subscribed Channels")
    )
})

export {
    toggleSubscription,
    getUserChannelSubscribers,
    getSubscribedChannels
}