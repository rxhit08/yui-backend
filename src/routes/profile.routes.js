import { Router } from "express";
import { verifyToken } from "../middlewares/verifyToken.middlewares.js";
import { Profile, getProfilePosts } from '../controllers/profile.controller.js'

const router = Router()

router.route("/user/:userName").get(verifyToken, Profile)

router.route("/user/:userName/profileposts").get(verifyToken, getProfilePosts)

export default router