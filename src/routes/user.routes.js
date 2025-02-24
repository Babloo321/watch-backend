import { Router } from "express";
import { 
  loginUser, 
  registerUser, 
  logoutUser,
  refreshAccessTokenGenerator,
  changeCurrentPassword ,
  getCurrentUser,
  updateAccountDetails,
  updateUserAvatar,
  updateUserCoverImage,
  getUserChannelProfile,
  getWatchHistory
 
} from "../controllers/user.controller.js";
import { upload } from "../middlewares/multer.middleware.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";
const userRouter = Router();

userRouter.route("/register").post(
  upload.fields([
    {
      name:"avatar",  // for frontend user name of the avtar_image should be avatar
      maxCount:1
    },
    {
      name:"coverImage",
      maxCount:1
    }
  ]),
  registerUser);

userRouter.route("/login").post(loginUser);
userRouter.route("/logout").post(verifyJWT,logoutUser);
userRouter.route("/refresh-token").post(refreshAccessTokenGenerator)
userRouter.route("/change-password").post(verifyJWT,changeCurrentPassword);
userRouter.route("/current-user").get(verifyJWT,getCurrentUser);
userRouter.route("/update-account").patch(verifyJWT,updateAccountDetails)
userRouter.route("/update-avatar").patch(verifyJWT,upload.single("avatar"),updateUserAvatar);
userRouter.route("/update-cover-image").patch(verifyJWT,upload.single("coverImage"),updateUserCoverImage);
userRouter.route("/c/:userName").get(verifyJWT,getUserChannelProfile);  // in this route pass value with the params
userRouter.route("/watch-history").get(verifyJWT,getWatchHistory);
export default userRouter;


