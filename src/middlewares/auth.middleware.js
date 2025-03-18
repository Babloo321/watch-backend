import User from "../models/user.model.js";
import ApiError from "../utils/apiError.js";
import asyncHandler from "../utils/asyncHandler.js";
import jwt from "jsonwebtoken";
export const verifyJWT = asyncHandler(async(req, res, next) => {
  try {
    const token =req.cookies?.accessToken || req.headers("Authorization");
    // ?.replace("Bearer ","");
    if(!token){
      throw new ApiError(401, "Unauthorized Request");
    }
  console.log("BackEnd-token: ",token);
    const decodedToken = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);
    const user = await User.findById(decodedToken?._id).select("-password");
    if(!user){
      throw new ApiError(401, "Invalid Access Token16");
    }
  
    req.user = user;
    next();
  } catch (error) {
    throw new ApiError(401, "Invalid Access Token22");
  }
})