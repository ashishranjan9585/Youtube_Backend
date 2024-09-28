//require('dotenv').config({path : './env'});
import dotenv from 'dotenv';
import ConnectDB from './db/index.js';
import {app} from './app.js';

dotenv.config({
    path : './.env'
})


ConnectDB()
.then(() => {
    app.listen(process.env.PORT || 8000, () => {
        console.log(`⚙️ Server is running at port : ${process.env.PORT}`);
    })
})
.catch((err) => {
    console.log("MONGO db connection failed !!! ", err);
})








/* 1.Approach by using IIFE 

const express = require('express');
const app = express();

(async () => {
    try {
        await mongoose.connect(`${process.env.MONGODB_UR}/${DB_NAME}`);

        app.on("error" ,(err) => {
            console.log("ERRROR :" ,err);
            throw err;
        });

        app.listen(process.env.PORT , () => {
             console.log(`App is listening on port ${process.env.PORT}`)
        })


    }catch(error){
        console.log("ERROR :" , error);
        throw error;
    }
})()

*/