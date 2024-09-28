import { User } from "../models/user.models.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import  jwt  from "jsonwebtoken";
import mongoose from "mongoose";

const generateAccessAndRefereshTokens = async(userId) => {
     try {
           const user = await User.findOne(userId);
           const accessToken = user.generateAccessToken();
           const refreshToken = user.generateReferenceToken();

           //save refreshToken in db 
           user.refreshToken = refreshToken
           await user.save({validateBeforeSave : false})

           return {accessToken , refreshToken};
     } catch(error) {
        throw new ApiError(500 , "Something went wrong while generating referesh and access token");
     }
}
const registerUser = asyncHandler(async(req ,res) => {
    //1. get user details from frontend but here we use postman 
    //2. validation - not empty
    //3. check if user already exist: username , email 
    //4. check for images , check for avatar 
    //5. upload them to cloudinary -> check on cloudinary for avatar
    //6. create user object - create entry in db
    //7. remove password and refresh token field from response
    //8. check for user creation
    //9. return res


 
   //1. get user details from frontend but here we use postman 
    const {fullname , email , username , password} = req.body;
      
   //2. validation - not empty
   /*if(fullname === "") {
       throw new ApiError(400, "fullName is required")

//trim used for remove unnecessary whitespace 
  before validating or processing the input.
   } */
   if(
      [fullname , email , username , password].some((fields) =>
        //field hai toh trim krdo ye bhi krne ke baad empty hai toh true return krdega(mtlb koi field khali hai).
         fields?.trim() === "")
   ){
       throw new ApiError(400 , "All field are required")
   }

   //3. check if user already exist: username , email 
   const  existedUser = await User.findOne({
     $or: [{ username } ,{ password }]
   })

   if(existedUser){
       throw new ApiError(409 , "username or email  Already Exist");
   }
   //jyse express ne diya hme req.body vaise hi multer ne req.files diya 
   //jyse ki hmare pass multiple files hai toh optional chaining achi practice h access krne ke liye
   //ab mujhe chaiye avatar isme v kffi feilds  hoti h jyse jpg , png , size etc. 
   //pr hme uska first property chaiye qki first perporty ke andr ek object milta hai usko aap optionally loge qki ho skta hai ni bhi mile ,
   //toh path likh skte ho issy kya hoga jo uska path hoga jo multer ne upload krra hai wo apko mil jyega.jyse file load hua multer ne ussy le aaya apne server pe kyse bola hai multer.miidleware me jao or wha dekho destination : me ek callback function ke andr ek filePath h  wha rkh lo or uska filename v wai rkh hai jo originalName hai 
   const avatarLocalPath = req.files?.avatar[0].path;
   //const coverImageLocalPath = req.files?.coverImage[0]?.path;
    let coverImageLocalPath;
    if(req.files && Array.isArray(req.files.coverImage) && req.files.coverImage.length > 0){
        coverImageLocalPath = req.files.coverImage[0].path ;
    }
   //check avatar
   if(!avatarLocalPath){
     throw new ApiError(400 , "Avatar file is required");
   }

   //5. upload them to cloudinary -> check on cloudinary for avatar
   const avatar =  await uploadOnCloudinary(avatarLocalPath);
    if(!avatar) {
        throw new ApiError(400 , "Avatar file is required");
    }
   const coverImage = await uploadOnCloudinary(coverImageLocalPath);

   //6. create user object - create entry in db
   const user = await User.create({
      fullname,
      avatar: avatar.url,
      coverImage: coverImage?.url || "",
      email,
      password,
      username: username.toLowerCase()
   })

    //8. check for user creation
   const createdUser =  await User.findById(user._id).select(
     "-password -refreshToken"
   )

     if(!createdUser){
         throw new ApiError(500 , "Something went wrong while registering the user")
     }

     //Return responses
     return res.status(201).json(
        new ApiResponse(200, createdUser, "User registered Successfully")
     )

    })

const loginUser = asyncHandler(async(req ,res) => {
     //1. req body -> data
     //2. username or email se signIn krwanye
     //3. find the user
     //4. password check
     //5. access and refresh token
     //6. send cookie

     //1. req body -> data
     const {email , username, password} = req.body;
      console.log(email);
     //2. username or email se signIn krwanye
     if(!(username || email)){
        throw new ApiError(400 , "username or email is required");
     }
     
      //3. find the user
     const user = await User.findOne({
        $or : [{username}, {email}]
     })

     if(!user) {
         throw new ApiError(404 , "User does not exist");
     }
       //4. password check
       const isPasswordValid = await user.isPasswordCorrect(password);

     if(!isPasswordValid){
        throw new ApiError(401 , "Invalid user credentials");
     }
      
      //5. access and refresh token
    
    const {accessToken , refreshToken} = await generateAccessAndRefereshTokens(user._id);
      //if u want to  cannot show user password and refreshToken :
    const loggedInUser = await User.findById(user._id).select("-password -refreshToken ");


     //6. send cookie
     const options = {
        //only backend can resolve or edit if anything u want not frontend can done this thing :
        httpOnly: true,
        secure: true
     }
    //saved in cookie
     return res
     .status(200)
     .cookie("accessToken" , accessToken , options)
     .cookie("refreshToken" , refreshToken , options)
     .json(
        new ApiResponse(
            200,
            {
                //if  user want to store in localstorage and know the accesstoken or refreshToken then write this.
                user : loggedInUser, accessToken, refreshToken
            },
            "User logged In Successfully"
        )
     )
})

 //LogOut Logic 
  
 const logoutUser = asyncHandler(async(req ,res) => {
       //1. remove tokens from the cookie
       //2. second thing is reset refreshToken when a user is logout , nd after login refreshToken generate
         await User.findByIdAndUpdate(
            req.user._id,
            {
                $unset: {
                     refreshToken : 1 //this remove the fields from document
                }
            },
            {
                new : true
            }
         )
     //1. remove tokens from the cookie
         const options = {
            //only backend can resolve or edit if anything u want not frontend can done this thing :
            httpOnly: true,
            secure: true
         }

         return res
         .status(200)
         .clearCookie("accessToken" , options)
         .clearCookie("refreshToken" , options)
         .json(
            new ApiResponse(
                200,
                {

                },
                "User logged Out"
            ));
 })
   
 const refreshAccessToken = asyncHandler(async (req, res) => {
    const incomingRefreshToken = req.cookies.refreshToken || req.body.refreshToken
   
    if (!incomingRefreshToken) {
        throw new ApiError(401, "unauthorized request")
    }

    try {
        const decodedToken = jwt.verify(
            incomingRefreshToken,
            process.env.REFRESH_TOKEN_SECRET
        )
    
        const user = await User.findById(decodedToken?._id)
    
        if (!user) {
            throw new ApiError(401, "Invalid refresh token")
        }
    
        if (incomingRefreshToken !== user?.refreshToken) {
            throw new ApiError(401, "Refresh token is expired or used")
            
        }
    
        const options = {
            httpOnly: true,
            secure: true
        }
    
        const {accessToken, newRefreshToken} = await generateAccessAndRefereshTokens(user._id)
    
        return res
        .status(200)
        .cookie("accessToken", accessToken, options)
        .cookie("refreshToken", newRefreshToken, options)
        .json(
            new ApiResponse(
                200, 
                {accessToken, refreshToken: newRefreshToken},
                "Access token refreshed"
            )
        )
    } catch (error) {
        throw new ApiError(401, error?.message || "Invalid refresh token")
    }

})

const changeCurrentPassword = asyncHandler(async(req, res) => {
    const {oldPassword , newPassword} = req.body;
   
    //User find who already login and u know auth miidleware we have a req.user to know who currently logged in 
    const user = await User.findById(req.user?._id)
    const isPassowrdCorrect = await user.isPasswordCorrect(oldPassword);

    if(!isPassowrdCorrect){
        throw new ApiError(400 , "Invalid Old Password");
    }
   
    user.password = newPassword
    await user.save({validateBeforeSave : false})
     
    return res
    .status(200)
    .json(
        new ApiResponse(
            200, {} , "Password changed Successfully"
        )
    )
})

const getCurrentUser = asyncHandler(async(req , res) => {
    return res
    .status(200)
    .json(
        new ApiResponse (200 , req.user , "current user fetched successfully"))
})


const updateAccountDetails = asyncHandler(async(req ,res) => {
    const  { email , fullname } = req.body;

    if(!(email || fullname)) {
        new ApiError(400 , "Fullname or email is required");
    }

    const user  = await User.findByIdAndUpdate(
        req.user?._id,
        {
            $set: {
                fullname : fullname,
                email : email
            }
        },
        { new : true}
    ).select("-password")

    return res
    .status(200)
    .json(new ApiResponse(200, user, "Account details updated successfully"))
});

const updateUserAvatar = asyncHandler(async(req ,res) => {
     const avatarLocalPath = req.file?.path

     if(!avatarLocalPath){
        throw new ApiError(400 , "Avatar file is missing")
     }

     const avatar = await uploadOnCloudinary(avatarLocalPath);

     if(!avatar.url){
        throw new ApiError(400, "Error while uploading on avatar")
     }

     const user = await User.findByIdAndUpdate(
        req.user?._id,
     {
        $set: {
            avatar : avatar.url
        }
     },
     { new  : true}
     ).select("-password ")

     return res
     .status(200)
     .json(
        new ApiResponse(200 , user , "Avatar image updated successfully")
     )
})

const updateCoverImage = asyncHandler(async(req ,res) => {
    const coverImageLocalPath = req.file?.path;

    if(!coverImageLocalPath){
        new ApiResponse(400 , "Cover image file is missing")
    }
    
    //TODO: DELETE OLD IMAGE -- ASSIGNMENT
     
    const coverImage = await uploadOnCloudinary(coverImageLocalPath);

    if(!coverImage.url){
        new ApiError(400 , "Error while uploading on coverImage")
    }

    const user = await User.findByIdAndUpdate(
        req.user?._id , 
        {
            $set: {
                coverImage: coverImage.url
            }
        },
        {new : true} //update ke baad ki info return hoti h aise
    ).select("-password")

    return res
    .status(200)
    .json(
        new ApiResponse(200, user, "Cover image updated successfully")
    )
})


const getUserChannelProfile = asyncHandler(async(req ,res) => {
    const { username } = req.params;

    if(!username?.trim()) {
        throw ApiError(400 , "username is missing")
    }

    const channel = await User.aggregate([
     {
        $match: {
            username : username?.toLowerCase()
        }
     },
     {
        $lookup: {
            from: "subscriptions",
            localField: "_id",
            foreignField: "channel",
            as: "subscribers"
        }
     },
     {
        $lookup: {
            from: "subscriptions",
            localField: "_id",
            foreignField: "subscriber",
            as: "subscribedTo"
        }
     },
     {
       $addFields: {
          subscribersCount: {
             $size: "$subscribers"
          },
          channelsSubscribedToCount: {
            $size: "$subscribedTo"
          },
          isSubscribed: {
            $cond: {
                if: {$in: [req.user?._id , "$subscribers.subscriber"]},
                then: true,
                else: false
            }
          }
       }
     },
     {
        $project: {
            fullname: 1,
            username: 1,
            subscribersCount: 1,
            channelsSubscribedToCount: 1,
            isSubscribed: 1,
            avatar: 1,
            coverImage: 1,
            email: 1
        }
     }
    ])

    if(!channel?.length){
        throw new ApiError(404 , "channel does not exists");
    }

    return res
    .status(200)
    .json(
        new ApiResponse(200, channel[0], "User channel fetched successfully")
    )
})

const getWatchHistory = asyncHandler(async(req ,res) => {
    const user = await User.aggregate([
        {
            $match: {
                _id: new mongoose.Types.ObjectId(req.user._id)
            }
        },
        {
            $lookup: {
                from: "videos",
                localField: "watchHistory",
                foreignField: "_id",
                as: "watchHistory",
                pipeline: [
                    {
                        $lookup:{
                            from: "users",
                            localField: "owner",
                            foreignField: "_id",
                            as: "owner",
                            pipeline: [
                                {
                                     $project: {
                                        fullname: 1,
                                        username: 1,
                                        avatar: 1
                                     }
                                }
                            ]
                        }
                    },
                    {
                        $addFields: {
                            owner: {
                                $first: "$owner"
                            }
                        }
                    }
                ]
            }
        }
    ])

    return res
    .status(200)
    .json(
        new ApiResponse(
            200,
            user[0].watchHistory,
            "Watch history fetched Successfully"
        )
    )
})






export { 
    registerUser ,
    loginUser ,
    logoutUser , 
    refreshAccessToken,
    changeCurrentPassword,
    getCurrentUser,
    updateAccountDetails,
    updateCoverImage,
    updateUserAvatar,
    getUserChannelProfile,
    getWatchHistory

};