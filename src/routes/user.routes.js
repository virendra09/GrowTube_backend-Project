import {Router} from "express";
import { registerUser } from "../controllers/user.controller.js";
import { upload } from "../middlewares/multer.middleware.js";

const router = Router()

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

export default router