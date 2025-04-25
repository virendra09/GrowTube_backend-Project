import {Router} from "express";
import { loginUser, registerUser, logoutUser } from "../controllers/user.controller.js";
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
export default router