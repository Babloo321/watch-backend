import mongoose, { isValidObjectId } from "mongoose";
import Video from "../models/video.model.js";
import ApiError from "../utils/ApiError.js";
import ApiResponse from "../utils/ApiResponse.js";
import asyncHandler from "../utils/asyncHandler.js";
import { deleteOnCloudinary, uploadOnCloudinary } from "../utils/cloudinary.js";
export const getRandomVideosWithoutToken = asyncHandler(async (req, res) => {
  try {
    // Fetch 10 random videos where isPublished is true
    const videos = await Video.aggregate([
      {
        $match: { isPublished: true }
      },
      {
        $project: {
          _id: 1,
          thumbnail: 1,
          title: 1,
          owner: 1,
          description: 1,
          videoFile: 1
        }
      },
      {
        $sample: { size: 10 } // Randomly selects 4 videos
      }
    ]).exec();

    if (!videos || videos.length === 0) {
      return res.status(404).json(new ApiError(404, "No videos found"));
    }

    res.status(200).json(new ApiResponse(200, videos, "Videos fetched successfully"));
  } catch (error) {
    console.error("Error fetching videos:", error);
    res.status(500).json(new ApiError(500, "Error fetching videos"));
  }
});


const getAllVideos = asyncHandler(async (req, res) => {
  const page = parseInt(req.query.page) || 1; // Support dynamic pagination
  const limit = parseInt(req.query.limit) || 10;
  // Check if userId is provided
  const userId = req.user?._id;
  if (!userId) {
    throw new ApiError(400, "User ID is required");
  }
  let matchCondition = {};

  if (userId) {
    // If user is logged in, fetch their own videos (both public & private) + all public videos
    matchCondition = {
      $or: [
        { owner: new mongoose.Types.ObjectId(userId) }, // Fetch user's own videos
        { isPublished: true }, // Fetch all public videos
      ],
    };
  } else {
    // If no user is logged in, fetch only public videos
    matchCondition = { isPublished: true };
  }
  
  // Ensure page and limit are numbers with defaults
  const pageNumber = Number(page) || 1; // Default to page 1
  const pageLimit = Number(limit) || 10; // Default to 10 videos per page
  
  // Aggregation pipeline
  const videos = await Video.aggregate([
    {
      $match: matchCondition,
    },
    {
      $sort: { createdAt: -1 }, // Sorting by newest first
    },
    {
      $skip: (pageNumber - 1) * pageLimit, // Pagination: skip
    },
    {
      $limit: pageLimit, // Pagination: limit
    },
    {
      $project: {
        videoFile: 1,
        thumbnail: 1,
        title: 1,
        description: 1,
        createdAt: 1,
        views: 1,
      },
    },
  ]);
  
  
  if (!videos.length) {
    throw new ApiError(404, "Videos not found");
  }

  console.log("Videos fetched successfully");

  return res
    .status(200)
    .json(new ApiResponse(200, videos, "Videos fetched successfully"));
});

const getPubliVideos = asyncHandler(async (req, res) => {
  const page = parseInt(req.query.page) || 1; // Support dynamic pagination
  const limit = parseInt(req.query.limit) || 10;
  const userId = req.user?._id;
  if (!isValidObjectId(userId)) {
    throw new ApiError(400, "User ID is required");
  }

  const videos = await Video.aggregate([
    {
      $match: {
        owner:userId, // Match only videos owned by the user
        isPublished: true, // Fetch only public videos
      },
    },
    {
      $sort: { createdAt: -1 }, // Sort by newest first
    },
    {
      $skip: (page - 1) * limit, // Pagination: skip
    },
    {
      $limit: limit, // Pagination: limit
    },
    {
      $project: {
        videoFile: 1,
        thumbnail: 1,
        title: 1,
        description: 1,
        createdAt: 1,
        views: 1,
        _id: 1,
      },
    },
  ]);
  
  console.log({UserId: userId});
  console.log("Videos fetched successfully",videos);
  // if (!videos.length) {
  //   return res
  //   .status(200)
  //   .json(
  //     new ApiResponse(200,{message:"No Availabel Videos: "},"Video Not Found")
  //   )
  // }

  return res
    .status(200)
    .json(new ApiResponse(200, videos, "Public Videos fetched successfully"));
});

const getPrivateVideos = asyncHandler(async (req, res) => {
  const page = parseInt(req.query.page) || 1; // Support dynamic pagination
  const limit = parseInt(req.query.limit) || 10;
  const userId = req.user?._id;
  if (!isValidObjectId(userId)) {
    throw new ApiError(400, "userId is not in req.user");
  }
  const videos = await Video.aggregate([
    {
      $match: { owner:userId,isPublished: false },
    },
    {
      $sort: { createdAt: -1 }, // Sorting by newest first
    },
    {
      $skip: (page - 1) * limit, // Pagination: skip
    },
    {
      $limit: limit, // Pagination: limit
    },
    {
      $project: {
        videoFile: 1,
        thumbnail: 1,
        title: 1,
        description: 1,
        createdAt: 1,
        views: 1,
        _id: 1,
      },
    },
  ]);

  return res
    .status(200)
    .json(new ApiResponse(200, videos, "Private Videos fetched successfully"));
});

const publishAVideo = asyncHandler(async (req, res) => {
  let { title, description, isPublished } = req.body;

  // Validate required fields
  if (!title?.trim() || !description?.trim()) {
    throw new ApiError(400, "Title and description are required");
  }

  isPublished = isPublished ?? true; // Default value handling

  // Check if the video already exists for the user
  const existsVideo = await Video.findOne({
    title,
    owner: req.user?._id,
  });

  if (existsVideo) {
    return res
      .status(409)
      .json(new ApiResponse(409, {}, "Video with this title already exists"));
  }

  // Get video and thumbnail file paths from request
  const videoFileLocalPath = req.files?.videoFile?.[0]?.path;
  const thumbnailLocalPath = req.files?.thumbnail?.[0]?.path;

  if (!videoFileLocalPath || !thumbnailLocalPath) {
    throw new ApiError(400, "Both video and thumbnail are required");
  }

  // Upload video and thumbnail to Cloudinary
  const videoFile = await uploadOnCloudinary(videoFileLocalPath, "video");
  const thumbnail = await uploadOnCloudinary(thumbnailLocalPath, "image");

  if (!videoFile || !thumbnail) {
    throw new ApiError(500, "Error uploading to Cloudinary");
  }

  // Save video metadata in MongoDB
  const video = await Video.create({
    videoFile: videoFile.url,
    thumbnail: thumbnail.url,
    videoFileId: videoFile.public_id,
    thumbnailId: thumbnail.public_id,
    title,
    description,
    owner: req.user?._id,
    isPublished,
  });

  console.log(`videoFileId: ${videoFile.public_id}`);
  console.log(`thumbnailId: ${thumbnail.public_id}`);
  const createdVideo = await Video.findById(video._id).select(
    "-owner -videoFileId -thumbnailId"
  );

  if (!createdVideo) {
    throw new ApiError(500, "Something went wrong while saving video");
  }

  console.log("Video uploaded successfully");

  return res
    .status(201)
    .json(new ApiResponse(201, createdVideo, "Video uploaded successfully"));
});

const getVideoById = asyncHandler(async (req, res) => {
  const { videoId } = req.params;
  //TODO: get video by id
  // first videoId verify karenge
  // than find video in database and than send to the user
  const _id = new mongoose.Schema.Types.ObjectId(videoId);
  if (isValidObjectId(_id)) {
    throw new ApiError(400, "Invalid Video Id");
  }

  const video = await Video.aggregate([
    {
      $match: {
        _id: new mongoose.Types.ObjectId(req.params?.videoId),
      },
    },
    {
      $project: {
        videoFile: 1,
        thumbnail: 1,
        title: 1,
        description: 1,
        _id: 0,
      },
    },
  ]);
  if (!video) {
    throw new ApiError(400, "Video not exists");
  }

  console.log(video);
  console.log("Video found");
  return res
    .status(200)
    .json(new ApiResponse(200, video, "Video fetched successfully"));
});

const updateVideo = asyncHandler(async (req, res) => {
  const { title, description } = req.body;
  const videoId = req.params?.videoId;
  // Validate video ID
  if (!isValidObjectId(videoId)) {
    throw new ApiError(400, "Invalid Video Id");
  }
  // Validate required fields
  if ([title, description].some((field) => field?.trim() === "")) {
    throw new ApiError(400, "All fields are required");
  }
  // Find video in the database
  const video = await Video.findById(videoId);
  if (!video) {
    throw new ApiError(404, "Video does not exist");
  }
  // If a new thumbnail is provided, delete the old one
  if (req.file) {
    const deleteResponse = await deleteOnCloudinary(video.thumbnailId, "image");
    if (deleteResponse.result !== "ok") {
      throw new ApiError(500, "Failed to delete old thumbnail on Cloudinary");
    }
    // Upload new thumbnail
    const uploadedThumbnail = await uploadOnCloudinary(req.file.path, "image");
    if (!uploadedThumbnail) {
      throw new ApiError(500, "Error uploading new thumbnail");
    }
    // Update video with new thumbnail
    video.thumbnail = uploadedThumbnail.url;
    video.thumbnailId = uploadedThumbnail.public_id;
  }
  // Update title and description
  video.title = title;
  video.description = description;
  // Save changes
  await video.save();
  console.log("✅ Successfully updated video in database");
  return res
    .status(200)
    .json(new ApiResponse(200, video, "Video updated successfully"));
});

const deleteVideo = asyncHandler(async (req, res) => {
  const videoId  = req.params;

  // Validate video ID
  if (!isValidObjectId(videoId)) {
    throw new ApiError(400, "Invalid Video Id");
  }

  // Find the video in the database
  const video = await Video.findById(videoId);
  if (!video) {
    throw new ApiError(404, "Video does not exist");
  }

  // Extract Cloudinary public IDs (assuming full URL is stored)
  let videoPublicId = video?.videoFileId;
  let thumbnailPublicId = video?.thumbnailId;
  console.log(`📌 Video File ID: ${videoPublicId}`);
  console.log(`📌 Thumbnail ID: ${thumbnailPublicId}`);
  // Delete video file and thumbnail from Cloudinary
  const videoDeleteOnCloudinary = await deleteOnCloudinary(
    videoPublicId,
    "video"
  );
  const thumbnailDeleteOnCloudinary = await deleteOnCloudinary(
    thumbnailPublicId,
    "image"
  );

  // Check if deletion was successful
  if (!videoDeleteOnCloudinary || !thumbnailDeleteOnCloudinary) {
    throw new ApiError(
      500,
      "Failed to delete video or thumbnail from Cloudinary"
    );
  }

  // Delete the video from MongoDB
  await Video.findByIdAndDelete(videoId);

  return res
    .status(200)
    .json(new ApiResponse(200, null, "Video deleted successfully"));
});

const togglePublishStatus = asyncHandler(async (req, res) => {
  const { videoId } = req.params;

  if (!isValidObjectId(videoId)) {
    throw new ApiError(400, "Invalid Video Id");
  }

  const video = await Video.findById(videoId);

  if (!video) {
    throw new ApiError(400, "Video not exists");
  }

  video.isPublished = !video.isPublished;
  await video.save();
  console.log("Video Publish Status Updated");
  return res
    .status(200)
    .json(new ApiResponse(200, video, "Video Publish Status Updated"));
});

const incrementViews = asyncHandler(async (req, res) => {
  const { videoId } = req.params;
  console.log("videoId: ",videoId);
  // Validate ObjectId
  if (!isValidObjectId(videoId)) {
    throw new ApiError(401, "Video ID is invalid...");
  }

  // Find the video and increment likes
  const updatedVideo = await Video.updateOne(
    { _id: videoId }, 
    { $inc: { views: 1 } } // Increment views by 1
  );

  // Check if video exists
  if (!updatedVideo) {
    throw new ApiError(404, "Video not found...");
  }

  console.log("Incremented likes: ", updatedVideo.likes); // Debugging log

  // Send success response
  return res.status(200).json(
    new ApiResponse(200, "Success", {
      message: "Successfully updated likes",
      likes: updatedVideo.likes, // Return updated like count
    })
  );
});

const decrementViews = asyncHandler(async (req, res) => {
  const { videoId } = req.params;

  if (!isValidObjectId(videoId)) {
    throw new ApiError(401, "Video ID is invalid...");
  }

  // Find the video and increment likes
  const updatedVideo = await Video.updateOne(
    { _id: videoId }, 
    { $inc: { views: -1 } } // Increment views by 1
  );

  // Check if video exists
  if (!updatedVideo) {
    throw new ApiError(404, "Video not found...");
  }

  console.log("Incremented likes: ", updatedVideo.likes); // Debugging log

  // Send success response
  return res.status(200).json(
    new ApiResponse(200, "Success", {
      message: "Successfully updated likes",
      likes: updatedVideo.likes, // Return updated like count
    })
  );
});

const querySearchVideo = asyncHandler(async (req, res) =>{
  try {
    const { query } = req.query; // Get search query
    const userId = req.user.id; // Get logged-in user's ID

    // Construct search filter
    const searchFilter = query
      ? {
          $or: [
            { title: { $regex: query, $options: "i" } }, // Case-insensitive search
            { description: { $regex: query, $options: "i" } },
          ],
        }
      : {}; // If no query, fetch all videos based on ownership and isPublished

    // Fetch videos with conditions
    const videos = await Video.find({
      $and: [
        searchFilter,
        {
          $or: [
            { owner: userId }, // Fetch all videos if user is the owner
            { isPublished: true }, // Fetch only published videos of other users
          ],
        },
      ],
    });

    res.status(200).json(videos);
  } catch (error) {
    console.error("Error fetching search results:", error);
    res.status(500).json({ message: "Server error" });
  }
})

const channelPublicVideo = asyncHandler(async(req,res) =>{
  const { userId } = req.params;
  const page = parseInt(req.query.page) || 1; // Support dynamic pagination
  const limit = parseInt(req.query.limit) || 10;
  if(!isValidObjectId(userId)){
    throw new ApiError(400, "Invalid UserId");
  }
  const videos = await Video.aggregate([
    {
      $match: {
        owner:new mongoose.Types.ObjectId(userId), // Match only videos owned by the user
        isPublished: true, // Fetch only public videos
      },
    },
    {
      $sort: { createdAt: -1 }, // Sort by newest first
    },
    // {
    //   $skip: (page - 1) * limit, // Pagination: skip
    // },
    {
      $limit: limit, // Pagination: limit
    },
    {
      $project: {
        videoFile: 1,
        thumbnail: 1,
        title: 1,
        description: 1,
        createdAt: 1,
        views: 1,
        _id: 1,
      },
    },
  ]);

  if(!videos){
    throw new ApiError(401, "No Available Videos");
  }
  return res
  .status(200)
  .json(
    new ApiResponse(200,videos,"Channel Public Video found Successfully")
  )
})
const channelPrivateVideo = asyncHandler(async(req,res) =>{
  const { userId } = req.params;
  const page = parseInt(req.query.page) || 1; // Support dynamic pagination
  const limit = parseInt(req.query.limit) || 10;
  if(!isValidObjectId(userId)){
    throw new ApiError(400, "Invalid UserId");
  }
  const videos = await Video.aggregate([
    {
      $match: {
        owner: new mongoose.Types.ObjectId(userId), // Match only videos owned by the user
        isPublished: false, // Fetch only public videos
      },
    },
    {
      $sort: { createdAt: -1 }, // Sort by newest first
    },
    // {
    //   $skip: (page - 1) * limit, // Pagination: skip
    // },
    {
      $limit: limit, // Pagination: limit
    },
    {
      $project: {
        videoFile: 1,
        thumbnail: 1,
        title: 1,
        description: 1,
        createdAt: 1,
        views: 1,
        _id: 1,
      },
    },
  ]);

  if(!videos){
    throw new ApiError(401, "No Available Videos");
  }
  return res
  .status(200)
  .json(
    new ApiResponse(200,videos,"Channel Private Video found Successfully")
  )
})
export {
  getAllVideos,
  getPubliVideos,
  getPrivateVideos,
  publishAVideo,
  getVideoById,
  updateVideo,
  deleteVideo,
  togglePublishStatus,
  incrementViews,
  decrementViews,
  querySearchVideo,
  channelPublicVideo,
  channelPrivateVideo
};
