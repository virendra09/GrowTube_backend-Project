import { ApiError } from "../utils/ApiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import jwt from "jsonwebtoken";
import { User } from "../models/user.model.js";



export const verifyJWT = asyncHandler(async(req, _, next)=>{
    try {
        const token = req.cookies?.accessToken || req.header("Authorization")?.replace("Bearer ", "")
    
        if(!token){
            throw new ApiError(401, "Unauthorized request")
        }
       
        //by this we can get decoded jwt 
        // sometimes we have to use await in jwt, we could configure it later.
        const decodedToken = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET)
    
       //database request
       const user = await User.findById(decodedToken?._id).select("-password -refreshToken")
    
       if(!user){
    
        throw new ApiError(401, "Invalid Access Token")
       }
    
        //when we get finally user then we add new object into req.
        req.user = user;
        next()
    } catch (error) {
          throw new ApiError(401, error?.message || "Invalid access token")
    }

})