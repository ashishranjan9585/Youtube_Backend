import mongoose, { isValidObjectId } from "mongoose";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import {Video} from "../models/video.models.js"
import { ApiResponse } from "../utils/ApiResponse.js";
import { Comment } from "../models/comment.models.js";

const getVideoComments = asyncHandler(async (req ,res) => {
    const {videoId } = req.params;
    const {page = 1 , limit = 10} = req.query;
    if(!isValidObjectId(videoId)){
        throw new ApiError(400 , "Invalid video id")
    }
    const allCommentInVideo = await Video.aggregate(
        [
            {
                $match: {
                    _id : new mongoose.Types.ObjectId(videoId)
                }
            },
            {
               $lookup:{
                from: "comments",
                localField: "_id",
                foreignField: "video",
                as: "allComment"
               } 
            },
            {
                $unwind: "$allComment"
            },
            {
                $project: {
                    allComment: 1,
                    _id: 0
                }
            }
        ]
    )

    if(!allCommentInVideo){
        throw new ApiError(401 ,"No comments there")
    }

    return res.status(200)
    .json(
        new ApiResponse(200 , allCommentInVideo , "Fetched all comments of video ")
    )
})

const addComment = asyncHandler(async (req , res) => {
    const { videoId } = req.params;
    const { content } = req.body;
    if(!videoId || isValidObjectId(videoId)) {
        throw new ApiError(400 , "Video id is Not Found");
    }

    const video = await Video.findById(videoId);
    if(!content){
        throw new ApiError(400 , "Content Not Found");
    }

    const comment = await Comment.create({
        content : content,
        video : videoId,
        owner: req.user?._id
    })
    if(!comment) {
        throw new ApiError(404 , "Couldn't Comment");
    }

    return res.status(200)
    .json(
        new ApiResponse(200 , comment , "Comment Successfully ")
    )
})

const updateComment = asyncHandler(async(req ,res) => {
    const { commentId } = req.params;
    const  {content } = req.body;
    if(!content || content.trim() === 0) {
        throw new ApiError(400, "Content cannot be empty")

    }
    const verifyComment = await Comment.findById(commentId);
    if(!verifyComment){
        throw new ApiError(401 , "Not Exist Comment");
    }
    if(verifyComment?.owner.toString() != req.user?._id.toString()){
        throw new ApiError(400, "Only valid user can update comment")
    }
    const comment = await Comment.findByIdAndUpdate(commentId , {
        $set: {
            content: content
        }
    },
        {
            new : true
        }
    )
    if(!comment){
        throw new ApiError(404 , "Could'nt update the comment")
    }
    return res.status(200)
        .json(new ApiResponse(200,comment, "Comment updated successfully"))
})


const deleteComment = asyncHandler(async(req ,res) => {
    const {commentId} = req.params;
    const comment = await Comment.findById(commentId);
     
    if (!comment) {
        throw new ApiError(402, "Couldnt find the comment")
    }
    if (comment.owner?.toString() !== req.user?._id.toString()) {
        throw new ApiError(400, "Only the owner can delete comment")
    }
    
    const newComment = await Comment.findByIdAndDelete(commentId);
    if (!newComment) {
        throw new ApiError(500, "Couldnt delete the comment")
    }
    return res.status(200)
        .json(new ApiResponse(200, newComment, "Comment deleted successfully"))

})

export {
    deleteComment,
    updateComment,
    getVideoComments,
    addComment
}