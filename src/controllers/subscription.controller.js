import mongoose , {isValidObjectId} from "mongoose";
import { User } from "../models/user.models.js";
import { Subscription } from "../models/subscription.models.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const toggleSubscription = asyncHandler(async(req , res) => {
    const {channalId} = req.params;
    if(!channalId  || !isValidObjectId(channalId)){
        throw ApiError(401 , "Channel is Invalid");

    }

    const checkChannelSubOrNot = await Subscription.findOne({
        channal : channalId,
        subscriber : req.user?._id

    })

    if(checkChannelSubOrNot){
        await Subscription.deleteOne({
            channal : channalId,
            subscriber : req.user?._id
        })
        return res.status(200).json(new ApiResponse(200 , null , "Unsubscribed"));
    }else{
       const subscribed =  await Subscription.create({
            channal : channalId,
            subscriber : req.user?._id
        })
        return res.status(200).json(new ApiResponse(200 , subscribed , "Subscribed"));
    }
})

// CONTROLLER to return subscriber list of a channel 
const getUserChannelSubscribers = asyncHandler(async(req ,res) => {
    const {channalId } = req.params;
    if(!channalId  || !isValidObjectId(channalId)){
        throw ApiError(401 , "Channel is Invalid");

    }

    const subscribers = await Subscription.aggregate([
        {
            $match: {
                channel : new mongoose.Types.ObjectId(channalId)
            }
        },
        {
            $group: {
                _id : "$subscriber"
            }
        }
    ])

    if(!subscribers){
        throw new ApiError(404 , "Subscribers NOT Found")
    }

    return res.status(201)
    .json(
        new ApiResponse(201 , subscribers , "Subscribers Fetched Successfully")
    )
})

const getSubscribedChannels = asyncHandler(async(req , res) => {
     const {subscriberId} = req.params;

     if(!subscriberId  || !isValidObjectId(subscriberId)){
        throw new ApiError(401 , "Channel is Invalid");
     }

     const subscribedChannel = await Subscription.aggregate([
        {
            $match: {
                subscriber: new mongoose.Types.ObjectId(subscriberId)
            }
        },
        {
            $group: {
                _id : "$channel"
            }
        }
     ])

     if(!subscribedChannel){
        throw new ApiError(401 , "Subscribed Channel Not Found")
     }

     return res
     .status(200)
     .json(
        new ApiResponse(
            200 ,
            subscribedChannel,
            "Subscribed Channel Fetched Successfully"
        )
     )
})

export {
    getSubscribedChannels,
    getUserChannelSubscribers,
    toggleSubscription
}