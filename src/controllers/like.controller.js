import mongoose, { isValidObjectId } from "mongoose";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import {Like} from "../models/like.models.js"
import { ApiResponse } from "../utils/ApiResponse.js";


const toggleVideoLike = asyncHandler(async(req ,res) => {
    const  {videoId } = req.params;

    if(!mongoose.isValidObjectId(videoId)){
        throw new ApiError(401 , "Invalid Video Id");
    }

    //Check if the video is already liked by user
    const videoLikeAlready = await Like.findOne({
        video: videoId,
        LikedBy: req.user._id
    });

    if(videoLikeAlready) {
        //If liked already , remove the like means dislike 
        await Like.findByIdAndDelete(videoLikeAlready?._id);

        return res
        .status(200)
        .json(
            new ApiResponse(200 , {} , "Video disliked successfully" )
        )
    }else{
        //if not like, create a new like
        await Like.create({
            video: videoId,
            LikedBy: req.user._id
        });
      
        return res
        .status(200)
        .json(
            new ApiResponse(200 , {} , "Video like successfully" )
        )

    }
});

const toggleCommentLike = asyncHandler(async(req ,res) => {
    const { commentId } = req.params;
    
    if(!mongoose.isValidObjectId(commentId)){
        throw new ApiError(401 , "Comment Id is Invalid");
    }

    // Check if the comment is already liked by the user
    const commentLikeAlready = await Like.findOne({
        comment: commentId,
        LikedBy: req.user._id 
});
    if(commentLikeAlready){
        await Like.findByIdAndDelete(commentLikeAlready._id);
      
        return res
        .status(200)
        .json(
            new ApiResponse(200 , {} , "Comment disliked successfully" )
        )

    }else{
        await Like.create({
            comment : commentId,
            LikedBy: req.user._id 
        });

        return res
        .status(200)
        .json(
            new ApiResponse(200 , {} , "Comment liked successfully" )
        )

    }
});

const toggleTweetLike = asyncHandler(async(req ,res) => {
    const {tweetId} = req.params;
    if(!mongoose.isValidObjectId(tweetId)){
        throw new ApiError(401 , "Tweet Id is Invalid");
    }

    const tweetLikeAlready = await Like.findOne({
        tweet : tweetId,
        LikedBy : req.user._id
    });

    if(tweetLikeAlready){
        await Like.findByIdAndDelete(tweetLikeAlready?._id);

        return res
        .status(200)
        .json(
            new ApiResponse(200 , {} , "Tweet disliked successfully")
        )
    }else{
        await Like.create({
            tweet : tweetId,
            LikedBy : req.user._id
        });

        return res
        .status(200)
        .json(
            new ApiResponse(200 , {} , "Tweet liked successfully")
        )
    }
});

const getLikedVideos = asyncHandler(async(req ,res) => {
    const likedVideos = await Like.aggregate([
        {
            $match: {
                LikedBy: req.user?._id //Ensure correct field name
            }
        },
        {
            $lookup: {
                from: "videos",
                localField: "video",
                foreignField: "_id",
                as: "likedVideo"
            }
        },
        {
            $unwind: "$likedVideo"
        },
        {
            $project: {
                _id : 0,      // Exclude the _id field from the like collection
                likedVideo: 1 //Include the liked video details
            }
        }
    ]);

    if (!likedVideos || likedVideos.length === 0) {
        throw new ApiError(404, "Couldn't find liked videos");
    }

    return res.status(200)
        .json(new ApiResponse(200, likedVideos, "Fetched all the liked videos successfully"));
});

export {
    getLikedVideos,
    toggleTweetLike,
    toggleCommentLike,
    toggleVideoLike
}
