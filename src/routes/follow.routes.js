import { Router } from 'express'
import { followUser, checkFollowing, unfollowUser, numberOfAccountsFollowed } from '../controllers/follow.controllers.js'
import { verifyToken } from '../middlewares/verifyToken.middlewares.js'

const router = Router()

router.route("/follow").post(verifyToken,followUser)

router.route("/isfollowing/:followingUserName").get(verifyToken, checkFollowing)

router.route("/unfollow").delete(verifyToken, unfollowUser)

router.route("/follow-stats/userName/:userName").get(numberOfAccountsFollowed)

export default router