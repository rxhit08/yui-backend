import { Router } from "express";
import { createPost, getFeed, addLike, getPostLikes, addComment, deleteComment, getPostById, addLikesOnComment,getCommentLikes, addReplies, deleteReplies, getReplies, addLikesOnReplies, getRepliesLikes } from "../controllers/post.controllers.js";
import { upload } from '../middlewares/multer.middlewares.js';
import { verifyToken } from "../middlewares/verifyToken.middlewares.js";

const router = Router()

router.route("/create").post(
    upload.fields([
        {
            name: 'image',
            maxCount: 1
        }
    ]),
    verifyToken,
    createPost)

router.route("/feed").get(verifyToken, getFeed)

router.route("/:id/addlike").patch(verifyToken, addLike)

router.route("/:id/getlikes").get(verifyToken, getPostLikes)

router.route("/:id/comment").post(verifyToken, addComment)

router.route("/:postId/comment/:commentId").delete(verifyToken, deleteComment)

router.route("/:id").get(verifyToken, getPostById)

router.route("/:postId/comment/:commentId/like").patch(verifyToken, addLikesOnComment)

router.route("/:postId/comment/:commentId/getlikes").get(verifyToken, getCommentLikes)

router.route("/:postId/comment/:commentId/addreplies").post(verifyToken, addReplies)

router.route("/:postId/comment/:commentId/replies/:repliesId").delete(verifyToken, deleteReplies)

router.route("/:postId/comment/:commentId/getreplies").get(verifyToken, getReplies)

router.route("/:postId/comment/:commentId/replies/:repliesId/like").patch(verifyToken, addLikesOnReplies)

router.route("/:postId/comment/:commentId/replies/:repliesId/getlikes").get(verifyToken, getRepliesLikes)

export default router