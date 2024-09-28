// ye auth middleware bss ye verify krega  user logged in hai ya ni 

import { ApiError } from "../utils/ApiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import jwt  from "jsonwebtoken";
import { User } from "../models/user.models.js";
 // _ use for if u no where use in this method(res) then pss _ inplace of res . ye isliye ki proffesional code me aisa hi hota hai babu
export const verifyJWT = asyncHandler(async(req , _ , next) => {
    try{
    const token = req.cookies?.accessToken || req.header("Authorization")?.replace("Bearer ", "")
      
    //console.log(token);
    if(!token) {
        throw new ApiError(401 , "Unauthorized request")
    }

    const decodedToken = jwt.verify(token , process.env.ACCESS_TOKEN_SECRET);

    const user = await User.findById(decodedToken?._id).select("-password -refreshToken");

    if(!user) {
        throw new ApiError(401, "Invalid Access Token")
    }
  
    req.user = user;
    next()
} catch(error){
    throw new ApiError(401, error?.message || "Invalid access token");
}
});