import Video from "../models/video.model.js";
import ApiError from "../utils/ApiError.js";
import ApiResponse from "../utils/ApiResponse.js";
import asyncHandler from "../utils/asyncHandler.js";

export const getHomeVidoes = asyncHandler(async (req, res) => {
  const videos = await Video.find({
    isPublished: true}, { videoFile: 1, thumbnail: 1, title: 1, description: 1, _id:1 })
  .sort({ createdAt: -1 })
  .exec();

  if (videos.length < 1) {
    throw new ApiError(400, "Videos not found");
  }
console.log("Video found successfully");
  return res
    .status(200)
    .json(new ApiResponse(200, videos, "Videos fetched successfully"));
})

export const getTrendingVideo = asyncHandler(async (req, res) => {
  const videos = await Video.find({
    isPublished: true}, { videoFile: 1, thumbnail: 1, title: 1, description: 1, _id:1 })
  .sort({ createdAt: -1 })
  .exec();

  if (videos.length < 1) {
    throw new ApiError(400, "Videos not found");
  }
console.log("Video found successfully");
  return res
    .status(200)
    .json(new ApiResponse(200, videos, "Videos fetched successfully"));
})

export const getAllVideos = asyncHandler(async (req, res) => {
  const videos = await Video.find({
    isPublished: true}, { videoFile: 1, thumbnail: 1, title: 1, description: 1, _id:1 })
  .sort({ createdAt: -1 })
  .exec();

  if (videos.length < 1) {
    throw new ApiError(400, "Videos not found");
  }
console.log("Video found successfully");
  return res
    .status(200)
    .json(new ApiResponse(200, videos, "Videos fetched successfully"));
})

