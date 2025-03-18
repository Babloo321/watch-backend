import mongoose, { isValidObjectId } from "mongoose";
import User from "../models/user.model.js";
import Subscription from "../models/subscription.model.js";
import ApiError from "../utils/ApiError.js";
import ApiResponse from "../utils/ApiResponse.js";
import asyncHandler from "../utils/asyncHandler.js";

// working code
const toggleSubscription = asyncHandler(async (req, res) => {
    const { channeld } = req.params;
    const subscriberId = req.user?._id;
    const {channelName} = req.body;

    if(!channelName) throw new ApiError(400, "Channel Name is Required");
    if (!isValidObjectId(subscriberId)) {
        throw new ApiError(400, "Invalid Subscriber ID");
    }

    if (channeld === subscriberId.toString()) {
        return res.status(200).json(new ApiResponse(200, { success: true }, "You can't subscribe to yourself"));
    }

    const existingChannel = await User.findById(channeld);
    if (!existingChannel) {
        throw new ApiError(400, "Channel does not exist. Please provide a valid channel.");
    }

    // Check if subscription already exists
    const existingSubscription = await Subscription.findOne({
        subscriber: subscriberId,
        channel: channeld,
    });

    if (existingSubscription) {
        // Unsubscribe (remove subscription)
        await Subscription.findByIdAndDelete(existingSubscription._id);
        return res.status(200).json(new ApiResponse(200, { success: false }, "Unsubscribed Successfully"));
    } else {
        // Subscribe (create new subscription)
        const newSubscription = await Subscription.create({
            subscriber: subscriberId,
            channel: channeld,
            channelName
        });
await newSubscription.save();
        return res.status(200).json(new ApiResponse(200, {success:true}, "Subscribed Successfully"));
    }
});

// working code
const getUserChannelSubscribers = asyncHandler(async (req, res) => {
    const { channelId } = req.params; // ✅ Extract channelId correctly

    console.log("Received Channel ID:", channelId); // ✅ Debugging Log

    if (!mongoose.Types.ObjectId.isValid(channelId)) {
        throw new ApiError(400, "Invalid Channel ID format");
    }

    // ✅ Corrected the User.findById() method
    const user = await User.findById(channelId);
    if (!user) {
        throw new ApiError(404, "Channel not found");
    }

    try {
        const subscribers = await Subscription.aggregate([
            {
                $match: {
                    channel: new mongoose.Types.ObjectId(channelId),
                },
            },
            {
                $lookup: {
                    from: "users",
                    localField: "subscriber",
                    foreignField: "_id",
                    as: "subscribers",
                    pipeline: [
                        {
                            $project: {
                                _id: 1, 
                                fullName: 1,
                                avatar: 1,
                                userName: 1,
                                coverImage: 1,
                            },
                        },
                    ],
                },
            },
            {
                $unwind: {
                    path: "$subscribers",
                    preserveNullAndEmptyArrays: true, // ✅ Prevents errors if no subscribers exist
                },
            },
            {
                $group: {
                    _id: "$channel",
                    subscribersList: { $push: "$subscribers" },
                    totalSubscribers: { $sum: 1 }, // ✅ Counting total subscribers
                },
            },
            {
                $project: {
                    _id: 0,
                    totalSubscribers: 1,
                    subscribersList: 1,
                },
            },
        ]);
        
        if (!subscribers.length) {
            return res.status(200).json(new ApiResponse(200, [], "No subscribers found for this channel"));
        }
        return res.status(200).json(new ApiResponse(200, subscribers, "Subscribed Channels"));
    } catch (error) {
        console.error("Error fetching subscribers:", error);
        throw new ApiError(500, "Internal Server Error");
    }
});

// controller to return channel list to which user has subscribed
const getCurrentUserSubscriptions = asyncHandler(async (req, res) => {
    const userId = req.user?._id;
    console.log("UserId: ", userId);

    if (!isValidObjectId(userId)) {
        throw new ApiError(400, "Invalid Subscriber Id");
    }

    // Corrected User existence check
    const existUser = await User.findById(userId);
    if (!existUser) {
        throw new ApiError(401, "Invalid User");
    }

    // Fetch subscriptions
    const subscriptions = await Subscription.aggregate([
        {
            $match: { subscriber: new mongoose.Types.ObjectId(userId) }
        },
        {
            $lookup: {
                from: "users", // Ensure this is the correct collection name
                localField: "channel", // Ensure this is the correct field name
                foreignField: "_id",
                as: "channelData"
            }
        },
        {
            $unwind: {
                path: "$channelData",
                preserveNullAndEmptyArrays: true // Prevents data loss if no match is found
            }
        },
        {
            $project: {
                _id: 0,
                "channelData._id": 1,
                "channelData.userName": 1,
                "channelData.fullName": 1,
                "channelData.watchHistory": 1,
                "channelData.coverImage": 1,
                "channelData.avatar": 1,
                "channelData.email": 1
            }
        }
    ]);

    console.log("Subscriptions: ", subscriptions);

    // Proper empty check
    if (subscriptions.length === 0) {
        throw new ApiError(404, "You are not subscribed to any channels");
    }

    return res
        .status(200)
        .json(new ApiResponse(200, subscriptions, "Successfully found your subscriptions"));
});


export {
    toggleSubscription,
    getUserChannelSubscribers,
    getCurrentUserSubscriptions
}