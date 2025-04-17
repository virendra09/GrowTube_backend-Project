import { asyncHandler } from "../utils/asyncHandler.js";
import {ApiError} from "../utils/ApiError.js"
import {User} from "../models/user.model.js"
import {uploadOnCloudinary} from "../utils/cloudinary.js"
import { ApiResponse } from "../utils/ApiResponse.js";
const registerUser = asyncHandler(async (req, res)=>{
   //get user details from frontend
   //validation  not empty
   //check if user already exixts: username, email
   //check for images, check for avatar
   //upload them to cloudinary, avatar
   //create user object - create entry in db
   //remove password add refresh token field from response
   //check for user creation
   //return res

   
   // we can get data in req.body, if the request come from form data or json data.
   const {fullName, email, username, password} = req.body
   console.log("email", email);

   if([fullName,email, username, password].some((field)=>field?.trim()==="")){
    throw new ApiError(400, "All fields are required")
   }

   if(!email.includes("@")){
    throw new ApiError(400, "Please write correct email")
   }

   
   //To check, is user already exixts or not. import {user} 
   //from user model, because user model can talk directly to data base.
   const existedUser = User.findOne({
    $or: [{username}, {email}]
   })
   
   if(existedUser){
    throw new ApiError(409, "User with this username or email already exixts")
   }


   //multer gives us functionality for the access of files like "req.files",
    const avatarLocalPath = req.files?.avatar[0]?.path;
    const coverImageLocalPath = req.files?.coverImage[0]?.path;

    if(!avatarLocalPath){
      throw new ApiError(400, "Avatar file is required")
    }

    const avatar = await uploadOnCloudinary(avatarLocalPath)
    const coverImage = await uploadOnCloudinary(coverImageLocalPath)

    if(!avatar){
      throw new ApiError(400,"Avatar file is required")
    }
    
    //create object and send to database with User.create().
    const user = await User.create({
                fullName,
                avatar: avatar.url,
                coverImage : coverImage?.url || "",
                email,
                password,
                username: username.toLowerCase()
    })
    
    const createdUser = await User.findById(User._id).select("-password -refreshToken")
    
    if(!createdUser){
      throw new ApiError(500, "Something went wrong while registering the user")
    }
     
    return  res.status(201).json(
      new ApiResponse(200, createdUser, "User registered successfully")
    )


})



export {registerUser}