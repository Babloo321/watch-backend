import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
const app = express();
// cors policy for client
const allowedOrigins = ["http://localhost:3000","*"];
app.use(cors({
  origin: function (origin, callback) {
    if (!origin || allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      callback(new Error("Not allowed by CORS"));
    }
  },
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE", "PATCH"],
  allowedHeaders: ["Content-Type", "Authorization"]
}));

app.use(express.json({limit:"16kb"}));
app.use(express.urlencoded({limit:"16kb",extended:true}));  // when data comes to the url, it will be in json format,extended makes it nested(you can send nested data in url)
app.use(express.static("public"));    // to store static data use a seperate folder to store data folder name is anything
app.use(cookieParser());    // to store data in cookies of user data to retrive user data and stored in cookies it coulde be working with server only

app.get("/", (req, res) => {
  res.send("Backend is running on Vercel!");
});

// import router
import userRouter from "./routes/user.routes.js";
app.use("/api/v1/users",userRouter);


// import videoRouter
import videoRouter from './routes/video.routes.js';
app.use("/api/v1/videos",videoRouter);

// import likeRouter
import likeRouter from "./routes/like.routes.js";
app.use("/api/v1/likes",likeRouter);

// import subscriptionRoute
import subscriptionRouter from "./routes/subscription.routes.js";
app.use("/api/v1/subscription",subscriptionRouter);

// import commentRouter
import commentRouter from './routes/comment.routes.js';
app.use("/api/v1/comments",commentRouter);

export default app;
