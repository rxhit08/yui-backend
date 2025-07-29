import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/AsyncHandler.js";
import { User } from "../models/user.models.js";
import { Follow } from "../models/follow.models.js"
import { uploadOnCloudinary } from '../utils/cloudinary.js';
import { Post } from "../models/post.models.js";
import jwt from 'jsonwebtoken'

const createPost = asyncHandler(async(req, res) => {
    const {caption} =req.body

    const userId = req.user.id

    let imagePath;

    if(req.files && Array.isArray(req.files.image) && req.files.image.length > 0) {
        imagePath = req.files?.image[0]
    }

    if (!caption && !imagePath) {
        throw new ApiError(404, "Either caption or image is required")
    }

    const image = imagePath
    ? await uploadOnCloudinary(imagePath.buffer, imagePath.originalname)
    : null;

    const post = await Post.create({
        user: userId,
        caption: caption || "",
        image: image?.url || ""
    })

    return res
    .status(200)
    .json(
        new ApiResponse(200, "Post created Successfully", post)
    )
    
})

const getFeed = asyncHandler(async(req, res) => {

    try {
        const userId = req.user.id


        const followingList = await Follow.find({follower : userId}).select("following")

        if (!followingList) {
            throw new ApiError(402, "Failed to generate Following Lists")
        }


        const followingIds = followingList.map(f => f.following)

        followingIds.push(userId);

        const posts = await Post.find({user : {$in: followingIds}})
        .populate("user", "userName name avatar")
        .sort({createdAt : -1})

        if (!posts) {
            throw new ApiError(404, "failed to retrieve posts")
        }

        return res
        .status(200)
        .json(
            new ApiResponse(200,posts, "Posts retrieved Successfully" )
        )
    } catch (error) {
        throw new ApiError(200, "Error fetching feed")
    }

})

const addLike = asyncHandler(async(req, res) => {

    const userId = req.user.id
    const postId = req.params.id

    const post = await Post.findById(postId)

    if (!post) {
        throw new ApiError(403, "Post not found")
    }
    
    const alreadyLiked = post.likes.map(id => id.toString()).includes(userId);


    if (alreadyLiked) {
        post.likes = post.likes.filter(id => id.toString() !== userId)
    } else {
        post.likes.push(userId)
    }

    await post.save()

    return res
    .status(200)
    .json({
        success: true,
        likesCount: post.likes.length,
        message: alreadyLiked ? "Like removed" : "Post Liked",
        liked: !alreadyLiked
    })
})

const getPostLikes = asyncHandler(async(req, res) => {
    const postId = req.params.id

    const post = await Post.findById(postId).populate("likes", "name userName avatar")

    if(!post) {
        throw new ApiError(401, "Post not found")
    }

    return res
    .status(200)
    .json(
        new ApiResponse(200, post.likes, "post likes fetched successfully")
    )
})

const getPostById = asyncHandler(async(req, res) => {
    const postId = req.params.id

    const post = await Post.findById(postId)
    .populate("user", "name avatar userName")
    .populate("comments.user","avatar userName")

    if (!post) {
        throw new ApiError(400, "Cannot find post")
    }

    //const newComment = post.comments[post.comments.length - 1]
    //await newComment.populate("user","name avatar")

    return res
    .status(200)
    .json(
        new ApiResponse(200, post, "Post data fetched successfully")
    )
})

const addComment = asyncHandler(async (req, res) => {
  const { text } = req.body;
  const userId = req.user.id;
  const postId = req.params.id;

  const post = await Post.findById(postId);
  if (!post) {
    throw new ApiError(403, "Post not found");
  }

  if (!text?.trim()) {
    throw new ApiError(403, "Comment is required");
  }

  const comment = { user: userId, text };
  post.comments.push(comment);
  await post.save();

  const updatedPost = await Post.findById(postId).populate("comments.user", "name avatar userName");

  const newComment = updatedPost.comments[updatedPost.comments.length - 1];

  return res.status(200).json(
    new ApiResponse(200, newComment, "Comment posted successfully")
  );
});

const deleteComment = asyncHandler(async(req, res)=> {
    const { postId, commentId } = req.params
    const userId = req.user.id


    const post = await Post.findOne(
        {
            _id: postId,
            "comments._id": commentId,
            "comments.user": userId
        }
    )


    if(!post) {
        throw new ApiError(403, "Unable to find the post or User unauthorized")
    }

    const deletedComment = await Post.findByIdAndUpdate(postId,{
        $pull: {
            comments: {_id: commentId}
        }
    })

    return res
    .status(200)
    .json(
        new ApiResponse(
            200, deleteComment, "Comment deleted Successfully"
        )
    )

})

const addLikesOnComment = asyncHandler(async (req, res) => {
  const userId = req.user.id;
  const { postId, commentId } = req.params;

  const post = await Post.findById(postId);

  if (!post) {
    throw new ApiError(404, "Post not Found");
  }

  const comment = post.comments.id(commentId);
  if (!comment) {
    throw new ApiError(402, "Comment not found or comment is deleted");
  }

  const alreadyLiked = comment.likes.map((id) => id.toString()).includes(userId);

  if (alreadyLiked) {
    comment.likes = comment.likes.filter((id) => id.toString() !== userId);
  } else {
    comment.likes.push(userId);
  }

  await post.save();

  return res.status(200).json({
    success: true,
    liked: !alreadyLiked,
    likesCount: comment.likes.length,
    data: comment,
    message: alreadyLiked ? "Like removed" : "Comment liked",
  });
});

const getCommentLikes = asyncHandler(async (req, res) => {
  const { postId, commentId } = req.params;

  const post = await Post.findById(postId).lean();
  
  if (!post) {
    throw new ApiError(401, "Post not found");
  }

  const comment = post.comments.find(c => c._id.toString() === commentId);

  if (!comment) {
    throw new ApiError(403, "Comment not found");
  }

  const populatedLikes = await User.find({
    _id: { $in: comment.likes }
  }).select("name userName avatar");

  return res.status(200).json(
    new ApiResponse(200, populatedLikes, "Comment likes fetched successfully")
  );
});


const addReplies = asyncHandler(async (req, res) => {
  const { text } = req.body;
  const userId = req.user.id;
  const { postId, commentId } = req.params;

  if (!text?.trim()) {
    throw new ApiError(403, "Reply is required");
  }

  const post = await Post.findById(postId);
  if (!post) {
    throw new ApiError(404, "Post not found");
  }

  const comment = post.comments.id(commentId);
  if (!comment) {
    throw new ApiError(403, "Comment doesn't exist or it has been deleted");
  }

  // Extract tagged users from @usernames
  const taggedUsernames = text.match(/@[\w._]+/g);
  let taggedUsers = [];
  if (taggedUsernames) {
    const usernames = taggedUsernames.map(tag => tag.slice(1));
    const users = await User.find({ userName: { $in: usernames } }).select("_id");
    taggedUsers = users.map(u => u._id);
  }

  const reply = {
    user: userId,
    text,
    taggedUsers,
  };

  comment.replies.push(reply);

  await post.save();

  const newReply = comment.replies[comment.replies.length - 1];

  const populatedUser = await User.findById(userId).select("name userName avatar");

  const responseReply = {
    ...newReply.toObject(),
    user: populatedUser,
  };

  return res
    .status(200)
    .json(new ApiResponse(200, responseReply, "Reply added successfully"));
});


const deleteReplies = asyncHandler(async (req, res) => {
  const { postId, commentId, repliesId } = req.params;
  const userId = req.user.id;

  const post = await Post.findById(postId)
    .populate("comments.user", "name userName avatar")
    .populate("comments.replies.user", "name userName avatar");


  if (!post) {
    throw new ApiError(404, "Post not found");
  }

  const comment = post.comments.id(commentId);
  if (!comment) {
    throw new ApiError(404, "Comment not found");
  }

  const reply = comment.replies.id(repliesId);
  if (!reply) {
    throw new ApiError(404, "Reply not found");
  }


  if (reply.user?._id.toString() !== userId.toString()) {
    throw new ApiError(403, "You are not allowed to delete this reply");
  }

  comment.replies.pull(repliesId);
  await post.save();

  return res.status(200).json(
    new ApiResponse(200, reply, "Reply deleted successfully")
  );
});

const getReplies = asyncHandler(async (req, res) => {
  const { postId, commentId } = req.params;
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 3;

  const post = await Post.findById(postId).populate(
    "comments.replies.user",
    "name userName avatar"
  );

  if (!post) {
    throw new ApiError(403, "Post not found");
  }

  const comment = post.comments.id(commentId);
  if (!comment) {
    throw new ApiError(403, "Comment not found");
  }

  const totalReplies = comment.replies.length;

  
  const sortedReplies = comment.replies
    .sort((a, b) => a.createdAt - b.createdAt);

  const startIndex = (page - 1) * limit;
  const paginatedReplies = sortedReplies.slice(startIndex, startIndex + limit);

  return res.status(200).json(
    new ApiResponse(200, {
      replies: paginatedReplies,
      totalReplies,
    }, "Replies fetched successfully")
  );
});


const addLikesOnReplies = asyncHandler(async(req, res) => {
    const userId = req.user.id
    const { postId, commentId, repliesId } = req.params

    const post = await Post.findById(postId)
    if(!post){
        throw new ApiError(403, "Post not found")
    }

    const comment = post.comments.id(commentId)
    if(!comment) {
        throw new ApiError(403, "Comment not found or is deleted")
    }

    const reply = comment.replies.id(repliesId)
    if(!reply) {
        throw new ApiError(403, "Reply not found or is deleted")
    }

    const alreadyLiked = reply.likes.map(id => id.toString()).includes(userId);

    if (alreadyLiked) {
        reply.likes = reply.likes.filter(id => id.toString() !== userId)
    } else {
        reply.likes.push(userId)
    }

    await post.save()

    return res.status(200).json({
    success: true,
    liked: !alreadyLiked,
    likesCount: reply.likes.length,
    data: reply,
    message: alreadyLiked ? "Like removed" : "Comment liked",
  });

})

const getRepliesLikes = asyncHandler(async(req, res) => {
  const { postId, commentId, repliesId} = req.params

  const post = await Post.findById(postId)

  if(!post) {
    throw new ApiError(403, "Post not found")
  }

  const comment = post.comments.id(commentId)

  if(!comment) {
    throw new ApiError(403, "Comment not found")
  }

  const reply = comment.replies.id(repliesId)

  if(!reply) {
    throw new ApiError(403, "Reply not found")
  }

  const populatedLikes = await User.find({
    _id: { $in: reply.likes }
  }).select("name userName avatar");

  return res
  .status(200)
  .json(
    new ApiResponse(200, populatedLikes, "likes fetched successfully")
  )

})

export {
    createPost,
    getFeed, 
    addLike,
    getPostLikes,
    addComment,
    deleteComment,
    getPostById,
    addLikesOnComment,
    getCommentLikes,
    addReplies,
    deleteReplies,
    getReplies,
    addLikesOnReplies,
    getRepliesLikes
}