import  {asyncHandler} from '../utils/asyncHandler.js';
import { User } from "../models/user.models.js";
import { Video } from '../models/video.models.js';
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import mongoose, { isValidObjectId } from 'mongoose';

const getAllVideos = asyncHandler(async(req ,res) => {
    const { page = 1 , limit = 10 , query , sortBy , sortType , userId} = req.query;
    //TODO: get all videos based on query, sort , pagination
    if(!userId || !isValidObjectId(userId)){
       throw new ApiError(400 , "User Not Found")
    }

    const videos = await User.aggregate([
        {
            $match: {
                _id : new mongoose.Types.ObjectId(userId)
            }
        },
        {
            $lookup: {
                from : "videos",
                localField: "_id",
                foreignField: "owner",
                as: "videos"
            }
        },
        {
            $unwind: "$videos"
        },
        {
            $project: {
                videos: 1,
                _id: 0
            }
        }
    ])
    if(videos.length === 0){
        return res
        .status(200)
        .json(
            new ApiResponse(200 , {} , "No videos there")
        )
 }
 let filteredVideos = videos.map(video => video.videos) //Extract the videos array
 if(query){
    filteredVideos = filteredVideos.filter(video => video.title.toLoweCase().includes(query) || video.title.includes(query));

 }
  if(sortBy && sortType){
    filteredVideos.sort((a , b) => {
        if(sortType === 'asc'){
            return a[sortBy] > b[sortBy] ? 1 : -1;
        }else{
            return a[sortBy] < b[sortBy] ? 1 : -1;
        }
    });
  }

  const paginate = (page , limit , videos) => {
    const startIndex = (page - 1) * limit;
    const endIndex = page * limit ;
    return videos.slice(startIndex , endIndex)
  }

  return res
  .status(200)
  .json(
    new ApiResponse(
        200,
        paginate(page ,limit , videos),
        "Video fetched Successfull"
    )
  )
})

const publishAVideo = asyncHandler(async(req ,res) => {
    const {title , description} = req.body;
    //TODO: get video , upload to cloudinary, create video
     if(!title && !description){
        throw new ApiError(402 , "Title  and  Description are required");
     }
    //Check if files are present
     const videoFiles = req.files?.videoFile;
     const thumbnailFiles = req.files?.thumbnail;

     if(!videoFiles || !videoFiles[0]) {
        throw new ApiError(400, "Video file must be required");
     }

     if (!thumbnailFiles || !thumbnailFiles[0]) {
        throw new ApiError(400, "Thumbnail file must be required");
    }

    const videoLocalPath = videoFiles[0].path;
    const thumbnailLocalPath = thumbnailFiles[0].path;

    //Upload on Clodinary
    const videoUpload = await uploadOnCloudinary(videoLocalPath); //return URL
    const thumbnailUpload = await uploadOnCloudinary(thumbnailLocalPath);

    if(!videoUpload){
        new ApiError(500 , "Something went wrong while uploading the video on Cloudinary");
    }
    if(!thumbnailUpload){
        new ApiError(500 , "Something went wrong while uploading the thumbnail on Cloudinary");
    }
    
    const user = await User.findById(req.user?._id);
    if (!user) {
        throw new ApiError(400, "User not found");
    }
    //create video 
    const video = await Video.create({
        videoFile : videoUpload.url,
        thumbnail : thumbnailUpload.url,
        title : title,
        description: description,
        duration: videoUpload.duration,
        views: 0,
        isPublished: true,
        owner: req.user?._id,
    });

    if (!video) {
        throw new ApiError(500, "Try again later");
    }

    const videoData = await Video.findById(video._id);
    if (!videoData) {
        throw new ApiError(410, "Video data not found");
    }

    return res
    .status(200)
    .json(
        new ApiResponse(200 , videoData , "Video is published")
    )
})  ;




const getVideoById = asyncHandler(async (req, res) => {
    const { videoId } = req.params;
    //TODO: get video by id
    if(!videoId || !isValidObjectId(videoId)) {
        throw new ApiError(401 , "VideoId is Invalid please check");
    }

    const video = await Video.findById(videoId);
    if(!video) {
        throw new ApiError(401 , "Video NOT Found Bete");
    }

    if(video){
        video.views = video.views + 1;
        await video.save({
            validateBeforeSave : true
        })
    }

    return res
    .status(200)
    .json(
        new ApiResponse(200 , video , "Video Fetched Successfully!>>>>>>")
    )
});

const updateVideo = asyncHandler(async (req, res) => {
    const { videoId } = req.params
    //TODO: update video details like title, description, thumbnail
    const { title , description , thumbnail } = req.body;

    if(!videoId || !isValidObjectId(videoId)) {
        throw new ApiError(401 , "Invalid Video-Id ");
    }

    const video = await Video.findById(videoId);
    if(!video){
        throw new ApiError(401 , "Video NOT Found ");
    }

    if(video?.owner.toString() !== req.user?._id.toString()){
        throw new ApiError(401 , "Only Owner Can Update... ");
    }

    const thumbnailLocalPath = req.files?.thumbnail[0].path;
    if(!thumbnailLocalPath){
        throw new ApiError(401 , "Thumbnail NOT Found!....");
    }

    const uploadThumbnail = await uploadOnCloudinary(thumbnailLocalPath);

    const updatedVideo = await Video.findByIdAndUpdate(
        videoId,
        {
            $set: {
                title,
                description,
                thumbnail : uploadThumbnail.url
            }
        },
        {
            new : true
        }
    )

    if(!updatedVideo){
        throw new ApiError(401 , "video NOT Found....")
       }
       return res
       .status(200)
       .json(
           new ApiResponse(
               200,
               updatedVideo,
               "video data updated sucessfully"
           )
       )
});

const deleteVideo = asyncHandler(async (req, res) => {
    const { videoId } = req.params;
   //TODO: delete video
   if(!videoId && !isValidObjectId(videoId)){
    throw new ApiError(400,"incalid video id in parmas")
}
  
const video = await Video.findById(videoId)
if(!video){
    throw new ApiError(400,"video not found")
}

if(video?.owner.toString()!==req.user?._id.toString()){
    throw new ApiError(401,"only owner can delete the video")
}

const deleteVideo = await Video.findByIdAndDelete(videoId);

if(!deleteVideo){
    throw new ApiError(401," try again later")
}

return res.status(200).
json( new ApiResponse(200,
    {},
    "successfully delete the video"
))

});

const togglePublishStatus = asyncHandler(async (req, res) => {
    const { videoId } = req.params
    if(!videoId || !isValidObjectId(videoId)){
        throw new ApiError(401 , "Invalid VideoId...");
    }

    const video = await Video.findById(videoId);


    if (!video) {
        throw new ApiError(401, "Video not found");
    }

    video.isPublished = !video.isPublished;
    await video.save({ validateBeforeSave: false });

    return res.status(200).json(
        new ApiResponse(200, video, "Toggle publish successful")
    );
})

export {
    getAllVideos,
    publishAVideo,
    getVideoById,
    updateVideo,
    deleteVideo,
    togglePublishStatus
}