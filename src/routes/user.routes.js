import {Router} from "express";
import { loginUser, 
        registerUser, 
        logoutUser, 
        changeCurrentpassword, 
        getCurrentUser, 
        updateAccountDetails, 
        updateUserAvatar, 
        updateUserCoverImage, 
        getUserChannelProfile, 
        getWatchHistory
     } from "../controllers/user.controller.js";


import { upload } from "../middlewares/multer.middleware.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import { refreshAccessToken } from "../controllers/user.controller.js";
const router = Router()

//first router for file uploads
router.route("/register").post(
    
 // we can inject middleware here.
 upload.fields([
    {
        name:"avatar",
        maxCount:1
    },{
        name: "coverImage",
        maxCount:1
    }
 ]),   

 //controller
 registerUser)


//second router 
router.route("/login").post(loginUser)


//third router for secured routes
//give refrence of middlewares.
router.route("/logout").post(verifyJWT, logoutUser)
router.route("/refresh-token").post(refreshAccessToken)

router.route("/change-password").post(verifyJWT, changeCurrentpassword)
router.route("/current-user").get(verifyJWT, getCurrentUser)
router.route("/update-account").patch(verifyJWT, updateAccountDetails)

router.route("/avatar").patch(verifyJWT, upload.single("avatar"), updateUserAvatar)
router.route("/cover-image").patch(verifyJWT, upload.single("coverImage"), updateUserCoverImage)

router.route("/c/:username").get(verifyJWT, getUserChannelProfile)
router.route("/history").get(verifyJWT, getWatchHistory)





export default router