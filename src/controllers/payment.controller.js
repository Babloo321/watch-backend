import mongoose, { isValidObjectId } from "mongoose";
import ApiResponse from "../utils/ApiResponse.js";
import asyncHandler from "../utils/asyncHandler.js";
import Razorpay from "razorpay";
import ApiError from "../utils/ApiError.js";
import crypto from 'crypto';

const razorpayInstance = new Razorpay({
  key_id:process.env.RAZORYPAY_KEY_ID,
  key_secret:process.env.RAZORPAY_SECRET
})

export const paymentSubscription = asyncHandler (async(req,res) =>{
  const {amount} = req.body;
  if(!amount){
    throw new ApiError(400,"Amount is required!");
  }
  try {
    const options = {
      amount:Number(amount * 100),
      currency:"INR",
      receipt:crypto.randomBytes(10).toString("hex"),
    }

    razorpayInstance.orders.create(options,(err,order) =>{
      if(err){
        console.log("error in order create: ",err)
        throw new ApiError(500,"Something went wrong with razorpayInstance orders create");
      }
      console.log("Order: ",order);
      return res
      .status(200)
      .json(
        new ApiResponse(200,order,"Order create in razorpay successfully")
      )
    })
  } catch (error) {
    throw new ApiError(402,"Payment Declined");
  }
})
