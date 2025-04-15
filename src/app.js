import express from 'express'
import cors from 'cors';
import cookieParser from 'cookie-parser';

const app = express();

// for the use of cross origin resources
app.use(cors({
    origin:process.env.CORS_ORIGIN,
    credentials:true
}))

//to limit the json 
app.use(express.json({limit:"20kb"}))

app.use(express.urlencoded({extended:true, limit:"20kb"}))

// To make public assets
app.use(express.static("public"))

app.use(cookieParser());


// routes import
import  userRouter from './routes/user.routes.js'



//routes declaration
app.use("/api/v1/users", userRouter)

// https://localhost:8000/api/v1/users.register


export {app}




