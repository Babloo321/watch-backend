import mongoose, {isValidObjectId} from "mongoose"
import Playlist from "../models/playlist.model.js"
import ApiError from "../utils/ApiError.js"
import ApiResponse from "../utils/ApiResponse.js"
import asyncHandler from "../utils/asyncHandler.js"
import User from '../models/user.model.js'

const createPlaylist = asyncHandler(async (req, res) => {
    const {name, description} = req.body
    //TODO: create playlist
    if(!(name || description)) {
        throw new ApiError(400, "All fields are required")
    }


    const existsPlaylist = await Playlist.findOne({name})
    if(existsPlaylist) {
        throw new ApiError(400, "Playlist already exists")
    }

    const playlist = await Playlist.create(
        {
            name,
             description,
               owner: req.user._id
            }
        )
        await playlist.save()
        return res
        .status(200)
        .json(
            new ApiResponse(200, playlist, "Playlist created successfully")
        )
    
})

const getUserPlaylists = asyncHandler(async (req, res) => {
    const {userId} = req.params
    //TODO: get user playlists
    if(!isValidObjectId(userId)) {
        throw new ApiError(400, "Invalid User Id")
    }

    const existUser = await User.findById(userId)
    if(!existUser) {
        throw new ApiError(400, "User not exists")
    }
    const getUserPlaylists = await Playlist.aggregate([
       { $match: {owner: new mongoose.Types.ObjectId(userId)},},
       {
           $lookup: {
               from: "videos",
               localField: "videos",
               foreignField: "_id",
               as: "videos",
               pipeline:[
                {
                    $project:{
                        title:1,
                        description:1,
                        thumbnail:1,
                        videoFile:1,
                        _id:0,
                        createdAt:1,

                    }
                },
                {
                    $addFields:{
                        videos:"$videos"
                    }
                }
               ]
           },
       },
       {
        $project: {
            name:1,
            description:1,
            videos:1,
            createdAt:1,
            _id:0
        }
    }
    ])
    return res
    .status(200)
    .json(
        new ApiResponse(200, getUserPlaylists, "Playlists fetched successfully")
    )
})

const getPlaylistById = asyncHandler(async (req, res) => {
    const { playlistId } = req.params
    //TODO: get user playlists
    if(!isValidObjectId(playlistId)) {
        throw new ApiError(400, "Invalid playlist Id")
    }

    const existsPlaylist = await Playlist.aggregate([
        {
            $match:{
                _id: new mongoose.Types.ObjectId(playlistId)
            }
        },
        {
            $lookup: {
                from: "videos",
                localField: "videos",
                foreignField: "_id",
                as: "videos",
                pipeline:[
                    {
                        $project:{
                            title:1,
                            description:1,
                            thumbnail:1,
                            videoFile:1,
                            _id:0,
                            createdAt:1,
                            views:1,
                            isPublished:1,
                        }
                    },
                    {
                        $addFields:{
                            videos:"$videos"
                        }
                    },
                   
                ]
            },
            
        },
        {
            $project:{
                _id:0,
                name:1,
                description:1,
                videos:1,
                owner:1,
                createdAt:1
            }
        }
      
    ])
    if(!existsPlaylist) {
        throw new ApiError(400, "Playlist not exists")
    }
    
    // const playlist = await Playlist.findById(playlistId).populate("videos").select("-owner -createdAt -updatedAt -_id")
    
    return res
    .status(200)
    .json(
        new ApiResponse(200, existsPlaylist[0], "Playlists fetched successfully")
    )
})

const addVideoToPlaylist = asyncHandler(async (req, res) => {
    const {videoId, playlistId} = req.params

    if(!(playlistId || videoId)){
        throw new ApiError(400, "PlaylistId and VideoId are required");
    }

    const existsPlaylist = await Playlist.findByIdAndUpdate(playlistId,{$push:{videos:videoId}},{new:true})
    if(!existsPlaylist) {
        throw new ApiError(400, "Playlist not exists")
    }

    return res
    .status(200)
    .json(
        new ApiResponse(200, existsPlaylist, "Video added to playlist successfully")
    )
})

const removeVideoFromPlaylist = asyncHandler(async (req, res) => {
    // TODO: remove video from playlist
    const {videoId, playlistId} = req.params

    if(!(playlistId || videoId)){
        throw new ApiError(400, "PlaylistId and VideoId are required");
    }

    const existsPlaylist = await Playlist.findByIdAndUpdate(playlistId,{$pull:{videos:videoId}},{new:true})
    if(!existsPlaylist) {
        throw new ApiError(400, "Playlist not exists")
    }

    return res
    .status(200)
    .json(
        new ApiResponse(200, existsPlaylist, "Video remove from the playlist successfully")
    )

})

const deletePlaylist = asyncHandler(async (req, res) => {
    const { playlistId } = req.params
    // TODO: delete playlist

    if(!isValidObjectId(playlistId)) {
        throw new ApiError(400, "Invalid Playlist Id")  
    }

    const existsPlaylist = await Playlist.findByIdAndDelete(playlistId)
    if(!existsPlaylist) {
        throw new ApiError(400, "Playlist not exists")
    }

    return res
    .status(200)
    .json(
        new ApiResponse(200, {}, "Playlist deleted successfully")
    )
})

const updatePlaylist = asyncHandler(async (req, res) => {
    const {playlistId} = req.params
    const {name, description} = req.body
    //TODO: update playlist
    if(!isValidObjectId(playlistId)){
        throw new ApiError(400, "Invalid Playlist Id")
    }

    if(!(name || description)){
        throw new ApiError(400, "All fields are required")
    }

    const existsPlaylist = await Playlist.findByIdAndUpdate(playlistId, {name, description}, {new:true})
    if(!existsPlaylist) {
        throw new ApiError(400, "Playlist not exists")
    }

    return res
    .status(200)
    .json(
        new ApiResponse(200, existsPlaylist, "Playlist updated successfully")
    )
})

export {
    createPlaylist,
    getUserPlaylists,
    getPlaylistById,
    addVideoToPlaylist,
    removeVideoFromPlaylist,
    deletePlaylist,
    updatePlaylist
}