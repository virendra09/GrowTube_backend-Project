//reqire('dotenv').config({path:'./env'})
import { app } from './app.js';
import dotenv from 'dotenv';
import connectDB from './db/index.js';


dotenv.config({
    path:'./env'
})



// database connection calls as asynchronously so that it will return Promises.
connectDB()
.then(()=>{
    app.listen(process.env.PORT || 8000, ()=>{
        console.log(`Server is running on port :${process.env.PORT}`)
    } )
})
.catch((err)=>{
   console.log("Mongo D connection failed in src>index.js", err)
})

























/*
import mongoose from 'mongoose';
import {DB_NAME} from "./constants";
import express from 'express';
const app = express();

;(async()=>{
    try{
        await mongoose.connect(`${process.env.MONGODB_URI}/${DB_NAME}`)
        app.on('error', ()=>{
            console.log("Our app is not able to connect with db", error);
            throw error;
        })
        
        app.listen(process.env.PORT, ()=>{
            console.log(`Server is runing on port ${process.env.PORT}`)
        })

    }
    catch(error){
         console.log("Error in db connection:", error)
         throw error;
    }
})()

*/