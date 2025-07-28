import { asyncHandler } from '../utils/AsyncHandler.js'
import { User } from '../models/user.models.js'
import { ApiError } from '../utils/ApiError.js';
import { ApiResponse } from '../utils/ApiResponse.js';
import { Post } from '../models/post.models.js';

const Profile = asyncHandler(async(req, res) => {

    const userName = req.params.userName

    const user = await User.findOne({userName: userName}).select("-password")

    if(!user) {
        throw new ApiError(404, "User not found")
    }

    return res
    .status(200)
    .json(
        new ApiResponse(200, user, "User details fetched successfully")
    )
})

const getProfilePosts = asyncHandler(async (req, res) => {
  try {
    const userName = req.params.userName

    if (!userName) {
      throw new ApiError(400, "Username is required");
    }

    const user = await User.findOne({ userName });
    if (!user) {
      throw new ApiError(404, "User not found");
    }

    const posts = await Post.find({ user: user._id })
      .populate("user", "userName name avatar") // populates user details in each post
      .sort({ createdAt: -1 });

    return res.status(200).json(
      new ApiResponse(
        200,
        posts,
        posts.length === 0 ? "No posts found" : "Posts retrieved successfully"
      )
    );
  } catch (error) {
    console.error("Error fetching profile posts:", error);
    return res
      .status(500)
      .json(new ApiResponse(500, null, "Error fetching profile posts"));
  }
});


export {
    Profile,
    getProfilePosts
}