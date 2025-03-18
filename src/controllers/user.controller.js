import asyncHandler from "../utils/asyncHandler.js";
import ApiError from "../utils/ApiError.js";
import User from "../models/user.model.js";
import { uploadOnCloudinary, deleteOnCloudinary } from '../utils/cloudinary.js';
import ApiResponse from "../utils/ApiResponse.js";
import jwt from "jsonwebtoken";
import mongoose, { isValidObjectId } from "mongoose";
import Video from "../models/video.model.js";
const generateAccessAndRefereshTokens = async userId => {
  try {
    let user = await User.findById(userId);
    const accessToken = user.generateAccessToken();
    const refreshToken = user.generateRefreshToken();

    user.refreshToken = refreshToken;
    await user.save({ validateBeforeSave: false });

    return { accessToken, refreshToken };
  } catch (error) {
    throw new ApiError(
      500,
      "Something went wrong while generating referesh and access token"
    );
  }
};

export const registerUser = asyncHandler(async (req, res) => {
  // get user details from frontend or postman
  // validation => check data is not empty
  // check if user already exists by their email,username
  // check for images or avatar
  // upload them to the cloudinary, avatar
  // hash password
  // create a new user object create entry call in db
  // remove password and refresh token field from response
  // check for user creation
  // save user to database
  // return response

  const { email, password, userName, fullName } = req.body;
  //  console.log("email: ", email)
  if (
    [email, password, userName, fullName].some(field => field?.trim() === "")
  ) {
    throw new ApiError(400, "All fields are required");
  }


  const existedUser = await User.findOne({ $or: [{ email }, { userName }] });

  if (existedUser) {
    throw new ApiError(409, "User with this email or username already exists");
  }
  const avatarLocalImage = req.files?.avatar[0]?.path;
  let coverLocalImage;
  if (
    req.files &&
    Array.isArray(req.files.coverImage) &&
    req.files.coverImage.length > 0
  ) {
    coverLocalImage = req.files.coverImage[0].path;
  }
  if (!avatarLocalImage) {
    throw new ApiError(400, "Avatar image is required");
  }

  const avatar = await uploadOnCloudinary(avatarLocalImage);
  const coverImage = await uploadOnCloudinary(coverLocalImage);
  if (!avatar) {
    throw new ApiError(500, "Error on Cloudinary plateform");
  }

  const avatarPublicId = avatar.public_id;
  const coverImagePublicId = coverImage?.public_id;
  const user = await User.create({
    email,
    password,
    userName: userName.toLowerCase(),
    fullName,
    avatar: avatar.url,
    coverImage: coverImage?.url || "",
    avatarId: avatarPublicId,
    coverImageId: coverImagePublicId,
  });
  //  console.log("DATA: ",user)
  const createdUser = await User.findById(user._id).select(
    "-password -refreshToken -avatarId, -coverImageId -__v"
  );
  if (!createdUser) {
    throw new ApiError(500, "Something went wrong while creating user");
  }
  console.log("User Created successfully");
  return res
    .status(201)
    .json(new ApiResponse(200, createdUser, "User created successfully"));
});

export const loginUser = asyncHandler(async (req, res) => {
  // req.body = {email,password}
  // validate email or username
  // find the user
  // password check
  // generate access token and refresh token
  // send access token in cookie send refresh token in cookie
  // send response

  const { email, password } = req.body;

  if (!email) {
    throw new ApiError(400, "Email or username is required");
  }

  let user = await User.findOne({ email });
  if (!user) {
    throw new ApiError(404, "User not found");
  }

  const isPasswordValid = await user.isPasswordCorrect(password);
  if (!isPasswordValid) {
    throw new ApiError(401, "Invalid user credentials");
  }

  // console.log("User: ", user);
  const { accessToken, refreshToken } = await generateAccessAndRefereshTokens(
    user._id
  );
  // console.log(`User: ${user}\nAccess Token: ${accessToken}\nRefresh Token: ${refreshToken}`);
  user = await User.findById(user._id).select("-password -refreshToken");

  // set access token and refresh token in cookies
  const cookieOptions = {
    httpOnly: true,
    secure: false,// set true if used https
  };
  console.log("User loging successfully")
  return res
    .status(200)
    .cookie("accessToken", accessToken, cookieOptions)
    .cookie("refreshToken", refreshToken, cookieOptions)
    .json(
      new ApiResponse(
        200,
        { user, accessToken, refreshToken },
        "User loogged in Successfully"
      )
    );
});

export const logoutUser = asyncHandler(async (req, res) => {
  // database me user find karenge to the help of req.user which is comming from auth middleware
  // delete refreshtoken from database
  // clear cookies

  await User.findByIdAndUpdate(
    req.user._id,
    {
      $unset: { refreshToken: 1 },    // this can remove refreshToken from user Database
    },
    { new: true }
  );

  const cookieOptions = {
    httpOnly: true,
    secure: true,
  };
  console.log("User logOut successfully");
  return res
    .status(200)
    .clearCookie("accessToken", cookieOptions)
    .clearCookie("refreshToken", cookieOptions)
    .json(new ApiResponse(200, {}, "User logged out successfully"));
});

export const refreshAccessTokenGenerator = asyncHandler(async (req, res) => {
  const incomingRefereshToken =
    req.cookies?.refreshToken || req.body.refreshToken;
  if (!incomingRefereshToken) {
    throw new ApiError(401, "Unauthorized Request");
  }
  try {
    const decodedToken = jwt.verify(
      incomingRefereshToken,
      process.env.REFRESH_TOKEN_SECRET
    );
    const user = await User.findById(decodedToken?._id);
    if (!user) {
      throw new ApiError(401, "Invalid RefreshToken");
    }

    if (incomingRefereshToken !== user?.refreshToken) {
      throw new ApiError(401, "Refresh Token in Expired or Used");
    }

    const { refreshToken, accessToken } = await generateAccessAndRefereshTokens(
      user._id
    );
    user.refreshToken = refreshToken;
    await user.save({ validateBeforeSave: false });
    const cookieOptions = {
      httpOnly: true,
      secure: true,
    };

    return res
      .status(200)
      .cookie("refreshToken", refreshToken, cookieOptions)
      .cookie("accessToken", accessToken, cookieOptions)
      .json(
        new ApiResponse(
          200,
          { user, refreshToken, accessToken },
          "Access Token Refreshed Successfully"
        )
      );
  } catch (error) {
    throw new ApiError(
      401,
      error?.message || "Unauthorized Request || Invalid Refresh Token"
    );
  }
});

export const changeCurrentPassword = asyncHandler(async (req, res) => {
  // old password
  // new password
  // user id
  // hash new password
  // update password

  const { oldPassword, newPassword } = req.body;

  if (!oldPassword) {
    throw new ApiError(400, "All fields are required");
  }
  if(!newPassword){
    throw new ApiError(400, "All fields are required");
  }

  const user = await User.findById(req.user?._id);
  const isPasswordCorrect = await user.isPasswordCorrect(oldPassword);

  if(!isPasswordCorrect){
    throw new ApiError(400, "Password is incorrected");
  }
  user.password = newPassword;
  await user.save({validateBeforeSave: false});
  return res
  .status(200)
  .json(new ApiResponse(200, {}, "Password Changed Successfully"));
})

export const getCurrentUser = asyncHandler(async(req,res) =>{
  const user = await User.findById(req.user?._id).select("-password -_id -createdAt -updatedAt -avatarId -coverImageId -__v");
return res
.status(200)
.json(new ApiResponse(200,user,"Current User fetched successfully"));
})

export const updateAccountDetails = asyncHandler(async(req,res) => {
  // get user from req
  // update user
  // send to the user

try {
    const {fullName,email} = req.body;
    if((!fullName)){
      throw new ApiError(400, "All fields are required");
      return;
    }
    if(!email){
      throw new ApiError(400, "All fields are required required");
      return;
    }
    const user = await User.findByIdAndUpdate(req.user?._id, {$set:{fullName,email}},{new:true}).select("-password")
    return res
    .status(200)
    .json(new ApiResponse(200,user,"Account details update successfully"));
} catch (error) {
  throw new ApiError(500, "Something went wrong while updating user");
}
})

export const updateUserAvatar = asyncHandler(async(req,res) =>{
  // first access avatar path from req
  // useing multer middleware to upload image
  // upload image to cloudinary if you want
  // update user avatar in database
  // send response
  const avatarLocalPath = req.file?.path
  if(!avatarLocalPath){
    throw new ApiError(400, "Avatar image is missing");
  }
    const deleteImageOnCloudinary = await deleteOnCloudinary(req.user?.avatarId);
    if(!deleteImageOnCloudinary){
      throw new ApiError(500, "Something went wrong while deleting avatar on cloudinary");
    }

  const avatar = await uploadOnCloudinary(avatarLocalPath);
  if(!avatar.url){
    throw new ApiError(400, "Error while uploading avatar on cloudinary")
  }

  let user = await User.findByIdAndUpdate(req.user?._id,{$set:{avatar:avatar.url}},{new:true}).select("-password");
   user = await User.findByIdAndUpdate(req.user?._id,{$set:{avatarId:avatar.public_id}},{new:true}).select("-password");
  if(!user){
    throw new ApiError(500, "Something went wrong while updating Avatar in the user");
  }
 
  return res
  .status(200)
  .json(new ApiResponse(200,user,"Avatar updated successfully"));
})

export const updateUserCoverImage = asyncHandler(async(req,res) =>{
  // first access coverImage path from req
  // useing multer middleware to upload image
  // upload image to cloudinary if you want
  // update user avatar in database
  // send response
  const coverLocalPath = req.file?.path
  if(!coverLocalPath){
    throw new ApiError(400, "Cover image is missing");
  }
  
  // remove image from cloudinary
  const deleteImageOnCloudinary = await deleteOnCloudinary(req.user?.coverImageId);
  if(!deleteImageOnCloudinary){
    throw new ApiError(500, "Something went wrong while deleting avatar on cloudinary");
  }

  // upload image to cloudinary
  const coverImage = await uploadOnCloudinary(coverLocalPath);
  if(!coverImage.url){
    throw new ApiError(400, "Error while uploading cover image on cloudinary")
  }

  // update avatar in database
  let user = await User.findByIdAndUpdate(req.user?._id,{$set:{coverImage:coverImage.url}},{new:true}).select("-password");
   user = await User.findByIdAndUpdate(req.user?._id,{$set:{coverImageId:coverImage.public_id}},{new:true}).select("-password");

  if(!user){
    throw new ApiError(500, "Something went wrong while updating Avatar in the user");
  }
 
  return res
  .status(200)
  .json(new ApiResponse(200,user,"CoverImage updated successfully"));
})

export const getUserChannelProfile = asyncHandler(async(req,res) => {
  // handling data coming from params
  const { userName } = req.params;
  if(!userName?.trim()){
    throw new ApiError(400, "userName is missing");
  }
  const channel = await User.aggregate([
    {
      $match:{userName:userName?.toLowerCase()}
    },
    {
      $lookup:{
        from:"subscriptions",
        localField:"_id",
        foreignField:"channel",
        as:"subscribers"
      }
    },
    {
      $lookup:{
        from:"subscriptions",
        localField:"_id",
        foreignField:"subscriber",
        as:"subscribed",
      }
    },
    {
      $addFields:{
        subscribersCount:{$size:"$subscribers"},
        subscribedCount:{$size:"$subscribed"},
        issubscribed:{
          $cond:{
            if:{$in:[req.user?._id, "$subscribers.subscriber"]},
            then:true,
            else:false
          }
        }
      }
    },
    {
      $project:{
        fullName:1,
        userName:1,
        avatar:1,
        coverImage:1,
        email:1,
        subscribersCount:1,
        subscribedCount:1,
        issubscribed:1
      }
    }
  ]);

  if(!channel?.length){
    throw new ApiError(404, "Channel not found");
  }
  return res
  .status(200)
  .json(
    new ApiResponse(200,channel[0],"User channel fetched successfully")
  )
})

export const getWatchHistory = asyncHandler(async(req,res) =>{
  const user = await User.aggregate([
    {
      $match:{
        _id: new mongoose.Types.ObjectId(req.user?._id)
      }
    },
    {
      $lookup:{
        from:"videos",
        localField:"watchHistory",
        foreignField:"_id",
        as:"watchHistory",
        pipeline:[{
          $lookup:{
            from:"users",
            localField:"owner",
            foreignField:"_id",
            as:"owner",
            pipeline:[
              {
                $project:{
                  fullName:1,
                  avatar:1,
                  userName:1
                }
              }
            ]
          },
        },
        {
          $addFields:{
            owner:{
              // $arrayElemAt:["$owner",0]
              $first:"$owner"
            }
          }
        }
      ]
      }
    }
  ]);
  return res
  .status(200)
  .json(
    new ApiResponse(
      200,
      user[0]?.watchHistory,
      "Watch history fetched successfully"
    )
  )
})

export const getVideoOwner = asyncHandler(async(req,res) => {
  const {videoId} = req.params;
  console.log("videoId: ",videoId)
  if(!isValidObjectId(videoId)){
    throw new ApiError(401, "Invalid videoId");
  }
  const videoWithOwner = await Video.aggregate([
    {
      $match: { _id: new mongoose.Types.ObjectId(videoId) } // Find the video by ID
    },
    {
      $lookup: {
        from: "users", // The collection name of users
        localField: "owner", // The field in Video collection
        foreignField: "_id", // The field in User collection
        as: "ownerData", // Alias for the joined data
        pipeline: [
          {
            $project: {
              _id: 1, // Exclude _id if not needed
              userName: 1,
              coverImage: 1,
            }
          }
        ]
      }
    },
    {
      $unwind: "$ownerData" // Convert ownerData array into an object
    },
    {
      $project: {
        _id: 0,
        views:1,
        owner: "$ownerData" // Only contains username & coverImage

      }
    }
  ]);
  
  console.log(videoWithOwner);
  
  
  return res
  .status(200)
  .json(
    new ApiResponse(
      200,
     {videoId: videoWithOwner},
      "videoId get"
    )
  )
})



