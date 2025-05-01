import { asyncHandler } from "../utils/asyncHandler.js";
import {ApiError} from "../utils/ApiError.js"
import {User} from "../models/user.model.js"
import {uploadOnCloudinary} from "../utils/cloudinary.js"
import { ApiResponse } from "../utils/ApiResponse.js";
import jwt from "jsonwebtoken";
import { deleteAvatar } from "../utils/deleteAvatar.js";
// import { totalmem } from "os";

const generateAccessAndRefreshTokens = async(userId)=>{
  try {
      const user =   await User.findById(userId)
      
      const accessToken = user.generateAccessToken()
      const refreshToken = user.generateRefreshToken()

      //adding the value pf refreshToken into user database.
      user.refreshToken = refreshToken

      //save the database but when data save then it should have also password, 
      // but here password is not present, so we use it to overcome this situation.  {validatBeforeSave: false}
      await user.save({validateBeforeSave: false})
       
      //return the access token and refresh token
      return {accessToken, refreshToken}



    } catch (error) {
    throw new ApiError(500, "Something went wrong while generating refresh and access token")
  }
}



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
   // console.log("email", email);

   if([fullName,email, username, password].some((field)=>field?.trim()==="")){
    throw new ApiError(400, "All fields are required")
   }

   if(!email.includes("@")){
    throw new ApiError(400, "Please write correct email")
   }

   
   //To check, is user already exixts or not. import {user} 
   //from user model, because user model can talk directly to data base.
   const existedUser = await User.findOne({
    $or: [{username}, {email}]
   })
   
   if(existedUser){
    throw new ApiError(409, "User with this username or email already exixts")
   }
  //console.log(req.files);

   //multer gives us functionality for the access of files like "req.files",
    const avatarLocalPath = req.files?.avatar[0]?.path;
   //  const coverImageLocalPath = req.files?.coverImage[0]?.path;
    
   let coverImageLocalPath;
   if(req.files && Array.isArray(req.files.coverImage) && req.files.coverImage.length > 0){
   
      coverImageLocalPath = req.files.coverImage[0].path
   }



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
    
    const createdUser = await User.findById(user._id).select("-password -refreshToken")
    
    if(!createdUser){
      throw new ApiError(500, "Something went wrong while registering the user")
    }
     
    return  res.status(201).json(
      new ApiResponse(200, createdUser, "User registered successfully")
    )


})

//...Login controller function.......
const loginUser = asyncHandler(async (req, res)=>{

   //req body -> data
   //username or email
   //find the user
   //password check
   //access and refresh token
   //send cookie

 
   const {email, username, password} = req.body
  
   if(!username && !email){
    throw new ApiError(400, "username or email is required")
   }
   // alternative of above
  //  {
  //   if(!(username || email)){
  //     throw new ApiError(400, "username or email is required")

  //   }
  //  }

   //check the username or email exixts or not.
    const user = await User.findOne({
    $or:[{email} , {username}]
   })

   //check the user exixts or not.
   if(!user){
    throw new ApiError(404, "User does not exist")
   }



   //check password is valid or not. 
const isPasswordValid = await user.isPasswordCorrect(password)

  if(!isPasswordValid){
    throw new ApiError(401, "Password is not correct.")
   }


 const {accessToken, refreshToken} = await generateAccessAndRefreshTokens(user._id)
 
 const loggedInUser = await User.findById(user._id).select("-password -refreshToken")

 //when we send cookies then we have to make options. options are basically objects.
 const options = {
  // by this cookies is only modified on server.
  httpOnly: true,
  secure : false   //  Production me true, localhost pe false
 }

  return res
  .status(200)
  .cookie("accessToken", accessToken, options)
  .cookie("refreshToken", refreshToken, options)
  .json(
    new ApiResponse(
      200,
      {
         // this.data = data
        //here we are sending again access and refresh Token just because may be the frontend maker want to save this for any purpose.
      user: loggedInUser, accessToken, refreshToken
      },
      "User logged in successfully."
    )
  ) 

})

//-----Complete Login Controller.....

// Logout controller function
const logoutUser = asyncHandler(async(req, res)=>{
   await  User.findByIdAndUpdate(
      req.user._id,
      {
         $unset:{
          refreshToken: 1 //this removes the field from document
         }
      },
      {
        new : true
      }
     )

  
  const options = {
    httpOnly : true,
    secure : true
  }

  return res
  .status(200)
  .clearCookie("accessToken", options)
  .clearCookie("refreshToken", options)
  .json(new ApiResponse(200, {}, "User logged out"))

})
//-----Complete Logout Controller.....



// To get the new access token, after access token expire time.
const refreshAccessToken = asyncHandler(async(req, res)=>{
     const incomingRefreshToken = req.cookies.refreshToken || req.body.refreshToken

     if(!incomingRefreshToken){
       throw new ApiError(401, "unauthorized request")
     }

     //try-catch block
try {
     const decodedToken =  jwt.verify(
        incomingRefreshToken,
        process.env.ACCESS_TOKEN_SECRET
       )
  
      const user = await User.findById(decodedToken?._id)
  
      if(!user){
        throw new ApiError(401, "Invalid refresh token")
      }
  
      if(incomingRefreshToken !== user?.refreshToken){
        throw new ApiError(401, "Refresh token is expired or used")
      }
  
      const options = {
        httpOnly : true,
        secure: false // production me true, localhost me false
      }
  
    const {accessToken, newRefreshToken} =  await generateAccessAndRefreshTokens(user._id)
  
      return res
      .status(200)
      .cookie("accessToken", accessToken, options)
      .cookie("refreshToken", newRefreshToken, options)
      .json(
        new ApiError(
          200,
          {accessToken, refreshToken: newRefreshToken},
          "Access token refreshed"
        )
      )
} catch (error) {
    throw new ApiError(401, error?.message || "Invalid refresh token")
}
})
//-----Complete refreshAccessToken  Controller.....


//Change Current Password controller function.
const changeCurrentpassword = asyncHandler(async(req, res)=>{
  const {oldPassword, newPassword} = req.body
  const user = await User.findById(req.user?._id)

  const isPasswordCorrect = await user.isPasswordCorrect(oldPassword)

  if(!isPasswordCorrect){
    throw new ApiError(400,"Invalid old password")
  }

  user.password = newPassword
  await user.save({validateBeforeSave:false})

  return res
  .status(200)
  .json(new ApiResponse(200, {}, "Password changed successfully"))
})

//-----  complete...........................


// To Get Current User .............
const getCurrentUser = asyncHandler(async(req, res)=>{
  return res
  .status(200)
  .json(new ApiResponse(200, req.user, "current user fetched successfully"))
})

//........ Complete......


// Update Account details controller
const updateAccountDetails = asyncHandler(async(req, res)=>{
  const {fullName, email} = req.body

  if(!fullName || !email){
    throw new ApiError(400, "All fields are required")
  }

 const user = await User.findByIdAndUpdate(
    req.user?._id,
    {
      $set:{
        fullName,  //fullName : fullName
        email      //email : email

      }
    },
    {new: true}  // information will be return after updation
  ).select("-password")

  return res
  .status(200)
  .json(new ApiResponse(200, user, "Account details updated successfully"))
  
})

//..........complete.............


// ... updateUserAvatar controller.......

// first thing :  use multer so that we can accept files.
// second thing : make sure who update only who logged in.

const updateUserAvatar = asyncHandler(async(req, res)=>{
       const avatarLocalPath = req.file?.path

       if(!avatarLocalPath){
        throw new ApiError(400, "Avatar file is missing")
       }

       const avatar = await uploadOnCloudinary(avatarLocalPath)

       if(!avatar.url){
        throw new ApiError(400, "Error while uploading on avatar")
       }

     const user =   await User.findByIdAndUpdate(
        req.user?._id,
        {
          $set:{
            avatar: avatar.url
          }
        },
        {new : true}
       ).select("-password")


       
  if (!user) {
    throw new ApiError(404, "User not found during avatar image upload.");
  }

   // Save old avatar publicId before updating
   const oldAvatarPublicId = user.avatar?.public_id;

   // Update user's avatar
   user.avatar = {
     public_id: avatar.public_id,
     url: avatar.url,
   };
 
   await user.save();
 
   // After saving, delete the old avatar if exists
   if (oldAvatarPublicId) {
     await deleteAvatar(oldAvatarPublicId);
   }

       return res
       .status(200)
       .json(
         new ApiResponse(200,user, "avatar image updated successfully")
       )
})

// ......complete..........


// update user Cover Image controller
const updateUserCoverImage = asyncHandler(async(req, res)=>{
  const coverImageLocalPath = req.file?.path

  if(!coverImageLocalPath){
   throw new ApiError(400, "Cover image file is missing")
  }

  const coverImage = await uploadOnCloudinary(coverImageLocalPath)

  if(!coverImage.url){
   throw new ApiError(400, "Error while uploading on cover image")
  }

 const user =  await User.findByIdAndUpdate(
   req.user?._id,
   {
     $set:{
       coverImage: coverImage.url
     }
   },
   {new : true}
  ).select("-password")

  return res
  .status(200)
  .json(
    new ApiResponse(200,user, "cover image updated successfully")
  )
})

//.......complete...............


//Get the user channel Profile with MONGODB AGGREGATION PIPELINE
const getUserChannelProfile = asyncHandler(async(req, res)=>{
  const {username} = req.params

  if(!username?.trim()){
    throw new ApiError(400, "username is missing")
  }

 const channel = await User.aggregate([
  //first pipeline to find the user.
  {
    $match:{
      username: username?.toLowerCase()
    }
  },

  //second pipeline to find the number of subscriber, user have.
  {
    $lookup:{
      from : "subscriptions",
      localField: "._id",
      foreignField: "channel",
      as: "subscribers"
    }
  },

 // third pipeline to find, how many channel subscribed by the user.
 {
   $lookup:{
    from : "subscriptions",
    localField: "._id",
    foreignField: "subscriber",
    as: "subscribedTo"
   }
 },

  // fourth pipeline to add the additional fields.
 {
     $addFields:{
         subscribersCount:{
          $size: "$subscribers"
         },
         channelsSubscribedToCount:{
          $size: "$subscribedTo"
         },
         isSubscribed: {
          $cond :{
            if:{$in: [req.user?._id, "$subscribers.subscriber"]},
            then: true,
            else : false
          }
         }
     }
 },

 //fifth pipeline
 {
   $project:{
    fullName : 1,
    username:1,
    subscribersCount: 1,
    channelsSubscribedToCount:1,
    isSubscribed:1,
    avatar:1,
    coverImage:1,
    email:1,
    _id:0
   }
 }
 ])
 


 if(!channel?.length){
  throw new ApiError(404, "channel doen not exist" )
 }

 return res
 .status(200)
 .json(
       new ApiResponse(200, channel[0], "User channel fetched successfully")
 )
})

//..........complete........

// Get the watch History............
const getWatchHistory = asyncHandler(async(req, res)=>{
 
  const user = await User.aggregate([
    {
      $match:{
        _id: new mongoose.Types.ObjectId(req.user._id)
      }
    },
    {
      $lookup:{
        from:"videos",
        localField:"watchHistory",
        foreignField: "_id",
        as: "watchHistory",
        //nested pipeine to lookup for user(owner of video) from videos
        pipeline:[
          {
            $lookup:{
              from:"users",
              localField:"owner" ,
              foreignField: "_id",
              as: "owner",

              pipeline:[
                {
                  $project:{
                    fullName:1,
                    username:1,
                    avatar:1
                  }
                }
             
              ]
            }
          },

          {
            $addFields:{
              owner:{
                $first:"$owner"
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
      "Watch history fetched successfully"
    )
   )
})

export {
  registerUser,
  loginUser,
  logoutUser,
  refreshAccessToken,
  changeCurrentpassword,
  getCurrentUser,
  updateAccountDetails,
  updateUserAvatar,
  updateUserCoverImage,
  getUserChannelProfile,
  getWatchHistory

}



