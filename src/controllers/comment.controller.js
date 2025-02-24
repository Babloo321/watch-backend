import mongoose, {isValidObjectId} from "mongoose"
import Comment from "../models/comment.model.js"
import ApiError from "../utils/ApiError.js"
import ApiResponse from "../utils/ApiResponse.js"
import asyncHandler from "../utils/asyncHandler.js"
import { contextsKey } from "express-validator/lib/base.js"

const getVideoComments = asyncHandler(async (req, res) => {
    //TODO: get all comments for a video
    const {videoId} = req.params
    const {page = 1, limit = 10} = req.query
    if(!isValidObjectId(videoId)){
        throw new ApiError(400, "Invalid Video Id")
    }

    const videoComment = await Comment.aggregate([
        {
            $match: {
                video: new mongoose.Types.ObjectId(videoId),
            },
        },
       {
        $project:{
            content: 1,
            _id:0,
            createdAt: 1
        }
       },
        {
            $skip: (parseInt(page) - 1) * parseInt(limit),
        },
        {
            $limit: parseInt(limit),
        },
    ])

    if(!videoComment){
        throw new ApiError(500, "Something went wrong while fetching comments")
    }
    return res
                .status(200)
                .json( 
                    new ApiResponse(
                        200,
                        videoComment,
                        "Comments fetched successfully"
                    )
                )

})

const addComment = asyncHandler(async (req, res) => {
    // TODO: add a comment to a video
    const { content } = req.body
    const { videoId } = req.params
    if(!isValidObjectId(videoId)){
        throw new ApiError(400, "Invalid Video Id")
    }
    if(!content){
        throw new ApiError(400, "Content is required")
    }
    const comment = await Comment.create({content,video:videoId,owner:req.user?._id})
    await comment.save()
    if(!comment){
        throw new ApiError(500, "Something went wrong while creating comment")
    }

    console.log("Comment created successfully");
    return res
    .status(200)
    .json(
        new ApiResponse(
            200,
            comment,
            "Comment created successfully"
        )
    )
})

const updateComment = asyncHandler(async (req, res) => {
    // TODO: update a comment
    const {commentId} = req.params
   
    if(!isValidObjectId(commentId)){
        throw new ApiError(400, "Invalid Comment Id")
    }
    const {content} = req.body
    if(!content){
        throw new ApiError(400, "Content is required")
    }
    const comment = await Comment.findByIdAndUpdate(commentId, {content}, {new: true}).select("content -_id")
    await comment.save()
    if(!comment){
        throw new ApiError(500, "Something went wrong while updating comment")
    }
    console.log("Comment updated successfully");
    return res
    .status(200)
    .json(
        new ApiResponse(
            200,
            comment,
            "Comment updated successfully"
        )
    )
})

const deleteComment = asyncHandler(async (req, res) => {
    // TODO: delete a comment
    let {commentId} = req.params
    if(!isValidObjectId(commentId)){
        throw new ApiError(400, "Invalid Comment Id")
    }
    const comment = await Comment.findByIdAndDelete(commentId)
    if(!comment){
        throw new ApiError(500, "Something went wrong while deleting comment")
    }
    console.log("Comment deleted successfully");
    return res
    .status(200)
    .json(
        new ApiResponse(
            200,
            {},
            "Comment deleted successfully"
        )
    )
})

export {
    getVideoComments, 
    addComment, 
    updateComment,
     deleteComment
    }