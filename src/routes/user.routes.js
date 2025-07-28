import { Router } from 'express'
import { registerUser, loginUser, logOutUser, changePassword, updateUserDetails, refreshAccessToken } from '../controllers/user.controllers.js'
import { verifyJWT } from '../middlewares/auth.middllewares.js';
import { upload } from '../middlewares/multer.middlewares.js';
import { verifyToken } from "../middlewares/verifyToken.middlewares.js";

const router = Router();

router.route("/register").post(
    upload.fields([
        {
            name: 'avatar',
            maxCount: 1
        },
        {
            name: 'coverImage',
            maxCount: 1
        }
    ]),
    registerUser
)

router.route("/login").post(loginUser)

router.route("logout").post(verifyJWT, logOutUser)

router.route("/change-password").post(verifyJWT, changePassword)

router.route("/update-details").patch(
    upload.fields([
        {
            name: 'avatar',
            maxCount: 1
        },
        {
            name: 'coverImage',
            maxCount: 1
        }
    ]),
    verifyToken, updateUserDetails)

router.route("/refresh-token").post(refreshAccessToken)

export default router