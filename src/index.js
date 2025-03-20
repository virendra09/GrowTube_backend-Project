//reqire('dotenv').config({path:'./env'})

import dotenv from 'dotenv';
import connectDB from './db/index.js';


dotenv.config({
    path:'./env'
})




connectDB();

























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