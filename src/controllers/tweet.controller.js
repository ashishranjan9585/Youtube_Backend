import mongoose, { isValidObjectId } from "mongoose";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import {Tweet} from "../models/tweet.models.js"
import { ApiResponse } from "../utils/ApiResponse.js";
import {User} from "../models/user.models.js";

const createTweet = asyncHandler(async(req ,res) => {
    const  {content} = req.body;

    if(!content){
        throw new ApiError(401 , "Enter valid content");
    }

    if(!isValidObjectId(req.user?._id)){
        throw new ApiError(401 , "User Not Registered");
    }

    const tweet = await Tweet.create({
        content: content,
        owner: req.user?._id
    });

    if(!tweet){
        throw new ApiError(500 , "Try Again Later");
    }

    return res.status(200)
    .json(
        new ApiResponse(200 , tweet , "Tweeted Successfully")
    )
})

const getUserTweets = asyncHandler(async(req ,res) => {
    const {userId} = req.params;
    if(!isValidObjectId){
        throw new ApiError(400 , "Invalid User-ID");
    }

    if(!userId){
        throw new ApiError(400 , "User does not Exist");
    }

    const user = await User.findById(userId);
    const allTweet = await Tweet.find({
           owner: userId
    })

    if(allTweet.length === 0){
        throw new ApiError(400,"No tweets by the user")
    }

    return res.status(200)
    .json(new ApiResponse(200,allTweet,"All tweets fetched successfully"))


})

const updateTweet = asyncHandler(async(req ,res) => {
    const {tweetId} = req.params;
    const {content} = req.body;

    if(!mongoose.isValidObjectId(tweetId)){
        throw new ApiError(400 , "Invalid Tweet-ID");
    
    }

    if(!content && content.trim().length === 0){
        throw new ApiError(400 , "Content field is Empty");
    }

    const newTweet = await Tweet.findById(tweetId);
    if(!newTweet){
        throw new ApiError(404 , "Tweet Not Found");
    }

    if(newTweet?.owner.toString() !== req.user?._id.toString()){
        throw new ApiError(404 , "only owner can edit their tweet.....")
    }

    const tweet = await Tweet.findByIdAndUpdate(
        tweetId,
        {
            $set:{
                content : content
            }
        },{new : true}
    )

    if(!tweet){
        throw new ApiError(500 , "Try Again Later")
    }

    return res.status(200)
    .json(
        new ApiResponse(200 , tweet , "Tweet updated successfully")
    )
})

const deleteTweet = asyncHandler(async(req ,res) => {
    const {tweetId} = req.params;
    if(!mongoose.isValidObjectId(tweetId)) {
        throw new ApiError(400 , "Invalid tweet ID")
    }

    const tweet = await Tweet.findById(tweetId);

    if (!tweet) {
        throw new ApiError(404, "Tweet not found");
    }
    if (tweet?.owner.toString() !== req.user?._id.toString()) {
        throw new ApiError(400, "only owner can edit thier tweet");
    }

    await Tweet.findByIdAndDelete(tweetId);

    if(!tweet){
        throw new ApiError(500,"Try again later")
    }
    return res.status(200)
    .json(new ApiResponse(200,{},"Tweet deleted successfully"))
})

const getAllTweets = asyncHandler(async(req ,res) => {
    const allTweets = await Tweet.aggregate([
        {
           $lookup: {
             from : "users",
             localField: "owner",
             foreignField: "_id",
             as: "user",
           }
        },
        {
            $unwind: "$user"
        },
        {
            $project: {
                _id: 1,
                content: 1,
                createdAt: 1,
                'user.username': 1
            }
        }
    ]);

    return res
    .status(200)
    .json(
        new ApiResponse(200 , {allTweets} , "All Tweets Fetched...")
    )
})

export {
    getAllTweets,
    deleteTweet,
    updateTweet,
    getUserTweets,
    createTweet 
}