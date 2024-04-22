import { Router } from "express";
import { 
    changeCurrentPassword,
    getCurrentUser, 
    getUserChannelProfile,
    getWatchHistory,
    incomingRefreshToken,
    loginUser, logoutUser,
    registerUser, 
    updateAccountDetails,
    updateUserAvatar, 
    updateUserCoverImage 
} from "../controllers/user.controller.js";

import { upload } from "../middlewares/multer.middleware.js";
import { verifyJWT } from "../middlewares/auth.middleare.js";

const router = Router()

router.route("/register").post(
    upload.fields([
        {
            name : "avatar",
            maxCount : 1
        },
        {
            name: "coverImage",
            maxCount: 1
        }
    ]),
    registerUser
);

router.route("/login").post( loginUser)

// secure routes 

router.route("/logout").post( verifyJWT ,logoutUser)
router.route("/refresh-Token").post(incomingRefreshToken)
router.route("/change-password").post(verifyJWT , changeCurrentPassword)
router.route("/current-User").get(verifyJWT , getCurrentUser)
router.route("/update-account").patch(verifyJWT , updateAccountDetails)
router.route("/update-avatar").patch(verifyJWT, upload.single("avatar"), updateUserAvatar)
router.route("/update-coverImage").patch(verifyJWT , upload.single("coverImage"), updateUserCoverImage)
router.route("/channel/:username").get(verifyJWT, getUserChannelProfile)

router.route("/history").get(verifyJWT, getWatchHistory)

export default router