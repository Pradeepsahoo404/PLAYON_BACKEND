import { Router } from "express";
import {changeCurrentPassword, getCurrentUser, logoutUser, refreshAccessToken, registerUser, updateAccountDetail, updateAvatar, updateCoverImage} from "../controllers/user.controller.js";
import { loginUser } from "../controllers/user.controller.js"; 
import {upload} from "../middlerwares/multer.middleware.js"
import { verifyJWT } from "../middlerwares/auth.middleware.js";


const router = Router();

    router.route("/register").post(upload.fields([{name : "avatar" , maxCount : 1},{name : "coverImage" , maxCount : 1}]),registerUser);

router.route("/login").post(loginUser)

//secured route
router.route("/logout").post( verifyJWT, logoutUser)

router.route("/refreshAccessToken").post(refreshAccessToken)

router.route("/changeCurrentPassword").post(verifyJWT , changeCurrentPassword)

router.route("/getCurrentUser").get(verifyJWT , getCurrentUser)

router.route("/updateAccountDetail").put( verifyJWT ,updateAccountDetail)

router.route("/updateAvatar").put(verifyJWT , upload.single("avatar"), updateAvatar)

router.route("/updateCoverImage").put(verifyJWT , upload.single("coverImage"), updateCoverImage)

export default router;
