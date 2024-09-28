import mongoose, { isValidObjectId } from "mongoose";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import {Playlist} from "../models/playlists.models.js"
import { ApiResponse } from "../utils/ApiResponse.js";
import {User} from "../models/user.models.js";

const createPlaylist = asyncHandler(async(req ,res) => {
    const {name , description} = req.body;

    const user = await User.findById(req.user?._id);
    if(!user) {
        throw new ApiError(401 , "User Not Found");
    }

    if(!name && !description){
        throw new ApiError(401 , "Content is Missing");
    }

    const playlist = await Playlist.create({
        name,
        description,
        owner: user._id
    })

    return res.status(200)
    .json(
        new ApiResponse(200 , playlist , "playlist successfully")
    )
})

const getUserPlaylists = asyncHandler(async(req ,res) => {
    const {userId} = req.params;
    if(!userId || isValidObjectId(userId)){
        throw new ApiError(400 , "Invalid Object id");
    }

    const user = await User.findById(userId).select("-password -refreshToken");

    if(!user){
        throw new ApiError(400 , "user not found>>>");
    }
   
    const playlists = await Playlist.find({
        owner : userId
    })

    if(!playlists){
        throw new ApiError(400 , "playlist not found>>>");
    }

    return res
    .status(200)
    .json(
        new ApiResponse(
            200,
            playlists,
            "playlists fetched successfully"
        )
    )
})

const getPlaylistById = asyncHandler(async(req ,res) => {
    const {playlistId} = req.params;
    if(!playlistId && !isValidObjectId(playlistId)) {
        throw new ApiError(401 , "Invalid Playlist Id");
    }
     
    const playlist = await Playlist.findById(playlistId);

    if(!playlist){
        throw new ApiError(404 , "playlist Not Found")
    }

    return res.status(201)
    .json(
        new ApiResponse(201 , playlist , "playlist fetched....")
    )
})

const addVideoToPlaylist = asyncHandler(async(req ,res) => {
    const {playlistId , videoId } = req.params;
    if(!playlistId && !videoId) {
        throw new ApiError(401, "wrong Id's ")
    }
    if(!isValidObjectId(playlistId) && !isValidObjectId(videoId)){
        throw new ApiError(401 , "Not a valid object in DB ");
    }

    const playlist = await Playlist.findById(playlistId)

    if(!playlist){
        throw new ApiError(400 , "Playlist NOT Found");
    }

    for(let i = 0 ; i < playlist.videos.length ; i++){
        if(playlist.videos[i] === videoId){
            throw new ApiError(401 , "Video is already available in playlist" )
        }
    }

    await playlist.videos.push(videoId);
    await playlist.save({ validateBeforeSave : true})

    return res
    .status(200)
    .json(
        new ApiResponse(
            200,
            playlist,
            "video added sucessfully"
        )
    )
});

const removeVideoFromPlaylist = asyncHandler(async(req ,res) => {
    const  {playlistId , videoId} = req.params;

    if(!playlistId || !isValidObjectId(playlistId)) {
        new ApiError(400 , "playlist id NOT Found")
    }

    if(!videoId || !isValidObjectId(videoId)){
        new ApiError(400 , "playlist id NOT Found")
    }

    const playlist = await Playlist.findById(playlistId);

    if(!playlist){
        throw new ApiError(401 , "playlist NOT FOUND IN DB");
    }

    //Debugging line
    console.log("Playlist Videos:" , playlist.videos);

    const updatedPlaylist = playlist.videos.filter((item) => {
        return !item.equals(videoId);
    });

    playlist.videos = updatedPlaylist;
    await playlist.save({ validateBeforeSave : true});

    return res
    .status(200)
    .json(
        new ApiResponse(
            200 ,
            playlist,
            "Video removed successfully"
        )
    );
});

const deletePlaylist = asyncHandler(async(req ,res) => {
    const {playlistId} = req.params;
    
    if (!playlistId || !isValidObjectId(playlistId)) {
        throw new ApiError(400 , "Invalid playlist Id")
    }

    const deletePlaylist = await Playlist.deleteOne({
        _id : playlistId
    })

    if(deletePlaylist.deletedCount === 0) {
         throw new ApiError(401 , "Playlist Not Found")
    }
    return res
    .status(200)
    .json(
        new ApiResponse(200 , {} , "Playlist Deleted...")
    )
});

const updatePlaylist = asyncHandler(async(req ,res) => {
    const {playlistId} = req.params;
    const  {name , description} = req.body;


    if(!playlistId && !isValidObjectId(playlistId)){
        throw new ApiError(400,"not a valid playlist id")
    }

    const playlist = await Playlist.findByIdAndUpdate(playlistId , {
        $set: {
            name,
            description
        }
    },
    {
        new : true
    })

    if(!playlist) {
        throw new ApiError(401 , "playlist not found")
    }

    return res
    .status(200)
    .json(
        new ApiResponse(
            200, 
            playlist,
            "playlist update successfully"
        )
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

