import mongoose, { isValidObjectId } from "mongoose";
import Video from "../models/video.model.js";
import User from "../models/user.model.js";
import ApiError from "../utils/ApiError.js";
import ApiResponse from "../utils/ApiResponse.js";
import asyncHandler from "../utils/asyncHandler.js";
import { deleteOnCloudinary, uploadOnCloudinary } from "../utils/cloudinay.js";

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
    // If user is logged in, fetch user's videos + all private videos
    matchCondition = {
      $or: [
        { owner: new mongoose.Types.ObjectId(userId) },
        { isPublished: false },
      ],
    };
  } else {
    // If no user is logged in, fetch only public videos
    matchCondition = { isPublished: false };
  }
  // Aggregation pipeline
  const videos = await Video.aggregate([
    {
      $match: matchCondition,
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

  const videos = await Video.aggregate([
    {
      $match: { isPublished: true },
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

  if (!videos.length) {
    throw new ApiError(404, "Videos not found");
  }

  return res
    .status(200)
    .json(new ApiResponse(200, videos, "Public Videos fetched successfully"));
});

const getPrivateVideos = asyncHandler(async (req, res) => {
  const page = parseInt(req.query.page) || 1; // Support dynamic pagination
  const limit = parseInt(req.query.limit) || 10;

  const videos = await Video.aggregate([
    {
      $match: { isPublished: false },
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

  if (!videos.length) {
    throw new ApiError(404, "Videos not found");
  }

  return res
    .status(200)
    .json(new ApiResponse(200, videos, "Private Videos fetched successfully"));
});
const publishAVideo = asyncHandler(async (req, res) => {
  const { title, description, isPublished } = req.body;
  // TODO: get video, upload to cloudinary, create video
  if ([title, description].some(field => field?.trim() === "")) {
    throw new ApiError(400, "All fields are required");
  }

  if (isPublished === undefined) {
    isPublished = true;
  }

  const existsVideo = await Video.findOne({
    $and: [{ title }, { owner: req.user?._id }],
  });
  if (existsVideo) {
    return res
      .status(401)
      .json(new ApiResponse(401, {}, "Video already exists"));
  }

  // getting video file which is coming from client side after using multi req.files accessible
  const videoFileLocalPath = req.files?.videoFile[0]?.path;
  const thumbnailLocalPath = req.files?.thumbnail[0]?.path;

  if (!(videoFileLocalPath || thumbnailLocalPath)) {
    throw new ApiError(400, "Video or thumbnail is required");
  }

  const videoFile = await uploadOnCloudinary(videoFileLocalPath);
  const thumbnail = await uploadOnCloudinary(thumbnailLocalPath);

  if (!(videoFile || thumbnail)) {
    throw new ApiError(500, "Error on Cloudinary plateform");
  }

  const video = await Video.create({
    videoFile: videoFile.url,
    thumbnail: thumbnail.url,
    videoFileId: videoFile?.public_id,
    thumbnailId: thumbnail?.public_id,
    title,
    description,
    owner: req.user?._id,
    isPublished: isPublished,
  });
  const createdVideo = await Video.findById(video._id).select(
    "-owner -videoFileId -thumbnailId"
  );
  if (!createdVideo) {
    throw new ApiError(500, "Something went wrong while creating video");
  }
  console.log("Video upload successfully");
  return res
    .status(200)
    .json(new ApiResponse(200, createdVideo, "Video upload successfully"));
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
  //TODO: update video details like title, description, thumbnail
  const videoId = req.params?.videoId;
  if (!isValidObjectId(videoId)) {
    throw new ApiError(400, "Invalid Video Id");
  }

  if ([title, description].some(field => field?.trim() === "")) {
    throw new ApiError(400, "All fields are required");
  }

  // Find the video in the database
  const video = await Video.findById(videoId);

  // Check if the video exists
  if (!video) {
    throw new ApiError(400, "Video does not exist");
  }

  // Delete the old video file and thumbnail on Cloudinary
  const videoDeleteOnCloudinary = await deleteOnCloudinary(video.videoFileId);
  //  const thumbnailDeleteOnCloudinary = await deleteOnCloudinary(video.thumbnailId);

  // If deletion on Cloudinary fails, return an error
  if (!videoDeleteOnCloudinary) {
    throw new ApiError(
      500,
      "Something went wrong while deleting old video or thumbnail on Cloudinary"
    );
  }
  //  if (!thumbnailDeleteOnCloudinary) {
  //      throw new ApiError(500, "Something went wrong while deleting old video or thumbnail on Cloudinary");
  //  }

  // Upload new video file on Cloudinary
  // getting video file which is coming from client side after using multi req.files accessible
  const videoFileLocalPath = req.file?.path;
  //  const thumbnailLocalPath = req.files?.thumbnail[0]?.path;

  const uploadedVideo = await uploadOnCloudinary(videoFileLocalPath);
  // Assume thumbnail is provided in req.body or req.file
  //  const uploadedThumbnail = await uploadOnCloudinary(thumbnailLocalPath);

  // Update the video data in the database
  video.videoFileId = uploadedVideo.public_id;
  //  video.thumbnailId = uploadedThumbnail.public_id;
  video.videoFile = uploadedVideo.url;
  //  video.thumbnail = uploadedThumbnail.url;
  video.title = title;
  video.description = description;
  await video.save();

  console.log("Successfully video updated in database");

  return res
    .status(200)
    .json(new ApiResponse(200, video, "Video updated successfully"));
});

const deleteVideo = asyncHandler(async (req, res) => {
  const videoId = req.params?.videoId;
  if (!isValidObjectId(videoId)) {
    throw new ApiError(400, "Invalid Video Id");
  }
  const video = await Video.findById(videoId);

  if (video.length < 1) {
    throw new ApiError(400, "Video not exists");
  }
  // Delete the video file and thumbnail on Cloudinary
  const videoDeleteOnCloudinary = await deleteOnCloudinary(video.videoFileId);
  const thumbnailDeleteOnCloudinary = await deleteOnCloudinary(
    video.thumbnailId
  );

  // If deletion on Cloudinary fails, return an error
  if (!(videoDeleteOnCloudinary || thumbnailDeleteOnCloudinary)) {
    throw new ApiError(
      500,
      "Something went wrong while deleting video or thumbnail on Cloudinary"
    );
  }

  // Delete the video collection from the database
  const videoDeleteFromDatabase = await Video.deleteMany({ _id: videoId });
  console.log("Successfully deleted video collection from the database");
  console.log("Successfully video deleted in database");

  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        videoDeleteFromDatabase,
        "Video deleted successfully"
      )
    );
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

export {
  getAllVideos,
  getPubliVideos,
  getPrivateVideos,
  publishAVideo,
  getVideoById,
  updateVideo,
  deleteVideo,
  togglePublishStatus,
};
