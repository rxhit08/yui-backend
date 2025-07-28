import { Router } from "express";
import { SearchUser } from "../controllers/search.controller.js"
import { verifyToken } from "../middlewares/verifyToken.middlewares.js";

const router = Router()

router.route("/searchuser").get(verifyToken, SearchUser)

export default router