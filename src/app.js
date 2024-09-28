import express from 'express';
import cors from "cors"
import cookieParser from "cookie-parser"

const app = express();
app.use(express.json({limit : "16kb"}));
app.use(express.urlencoded({extended: true, limit: "16kb"}));
app.use(express.static("public"))

app.use(cors({
    origin : process.env.CORS_ORIGIN,
    credentials : true
}));
app.use(cookieParser());

// routes import 
import userRouter from './routes/user.routes.js'
import videoRouter from './routes/video.route.js'
import commentRouter from './routes/comment.routes.js'
import likeRouter from './routes/like.routes.js'
import tweetRouter from './routes/tweet.routes.js'
import playlistRouter from './routes/playlist.routes.js'
import subscriptionRouter from './routes/subscription.routes.js'
// routes declaration
app.use("/api/v1/users" , userRouter);
//http://localhost:8000/api/v1/users/register

app.use("/api/v1/video",videoRouter)
app.use("/api/v1/comment",commentRouter)
app.use("/api/v1/like",likeRouter)
app.use("/api/v1/tweet",tweetRouter)
app.use("/api/v1/playlist",playlistRouter)
app.use("/api/v1/subscription" , subscriptionRouter)


export {app};