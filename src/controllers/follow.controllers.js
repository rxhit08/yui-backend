import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/AsyncHandler.js";
import { Follow } from "../models/follow.models.js"
import { User } from "../models/user.models.js";

const followUser = asyncHandler(async (req, res) => {
  const { followingUserName } = req.body;
  const followerUserName = req.user.userName;

  //console.log(followingUserName , followerUserName)

  if (followerUserName === followingUserName) {
    throw new ApiError(400, "Cannot follow yourself");
  }

  const followerUser = await User.findOne({ userName: followerUserName });
  const followingUser = await User.findOne({ userName: followingUserName });

  if (!followerUser || !followingUser) {
    throw new ApiError(404, "User not found");
  }

  const existingFollow = await Follow.findOne({
    follower: followerUser._id,
    following: followingUser._id,
  });

  if (existingFollow) {
    return res.status(200).json(
      new ApiResponse(200, "Already following", {
        alreadyFollowing: true,
      })
    );
  }

  const followedUser = await Follow.create({
    follower: followerUser._id,
    following: followingUser._id,
  });

  if (!followedUser) {
    throw new ApiError(500, "Failed to follow user");
  }

  return res.status(200).json(
    new ApiResponse(200, "User followed successfully", {
      alreadyFollowing: false,
    })
  );
});

const checkFollowing = asyncHandler(async (req, res) => {
  const followerUserName = req.user.userName;
  const { followingUserName } = req.params;

  if (followerUserName === followingUserName) {
    return res.status(200).json(new ApiResponse(200, "Own profile", { isFollowing: false }));
  }

  const followerUser = await User.findOne({ userName: followerUserName });
  const followingUser = await User.findOne({ userName: followingUserName });

  if (!followerUser || !followingUser) {
    throw new ApiError(404, "User not found");
  }

  const isFollowing = await Follow.exists({
    follower: followerUser._id,
    following: followingUser._id,
  });

  return res.status(200).json(
    new ApiResponse(200, { isFollowing: !!isFollowing }, "Follow status fetched")
  );
});


const unfollowUser = asyncHandler(async(req, res) => {
  const { followingUserName } = req.body;
  const followerUserName = req.user.userName;

  const followerUser = await User.findOne({userName: followerUserName})
  const followingUser = await User.findOne({userName: followingUserName})

  if(!followerUser || !followingUser){
      throw new ApiError(402, "Cannot find User")
  }

  const notFollowing = await Follow.findOne({
      follower: followerUser._id,
      following: followingUser._id
  })
  
  if(!notFollowing) {
      throw new ApiError(403, "Not following this User")
  }

  const unfollowedUser = await Follow.findOneAndDelete({
      follower: followerUser._id,
      following: followingUser._id
  })

  if(!unfollowedUser) {
      throw new ApiError(403, "Failed to unfollow")
  }

  return res
  .status(200)
  .json(
      new ApiResponse(200, "User unfollowed Successfully", unfollowedUser)
  )
})

const numberOfAccountsFollowed = asyncHandler(async(req, res) => {
    const userName = req.params.userName

    if(!userName) {
        throw new ApiError(401, "Username is required")
    }

    const user = await User.findOne({userName: userName}).select("_id")

    if (!user) {
        throw new ApiError(404, "User not found")
    }

    const [followerCount, followingCount] = await Promise.all([
        Follow.countDocuments({following: user._id}),
        Follow.countDocuments({follower: user._id})
    ])

    return res
    .status(200)
    .json(
        new ApiResponse(200,
        {
            user,
            followers: followerCount,
            following: followingCount   
        },
        "follower and following count fetched successfully"
        )
    )

})

export {
    followUser,
    checkFollowing,
    unfollowUser,
    numberOfAccountsFollowed
}