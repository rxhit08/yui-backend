import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/AsyncHandler.js";
import { User } from "../models/user.models.js"
import { userUpdate } from "../middlewares/userupdate.middlewares.js";
import { uploadOnCloudinary } from '../utils/cloudinary.js';

const generateAccessAndRefreshToken = async function(userId) {
    try {
        const user = await User.findById(userId)
        const accessToken = user.generateAccessToken()
        const refreshToken = user.generateRefreshToken()

        user.refreshToken = refreshToken

        await user.save({validateBeforeSave: false})

        return {accessToken, refreshToken}
    } catch (error) {
        throw new ApiError(500, "failed to generate tokens")
    }
}

const registerUser = asyncHandler(async (req, res, next) => {
    const {userName, email, name, gender, password} = req.body;
    
    const dateOfBirth = new Date(req.body.dateOfBirth)

    if([userName, email, name, gender, password].some((field) => field?.trim() === "") || !dateOfBirth) {
        throw new ApiError(400, "all fields are required")
    }

    const existedUser = await User.findOne(
        {
            $or: [{email}, {userName}]
        }
    )

    if(existedUser) {
        throw new ApiError(409, "User already exists")
    }

    let avatarLocalPath;
    let coverImageLocalPath;

    if (req.files && Array.isArray(req.files.avatar) && req.files.avatar.length > 0) 
    {
        avatarLocalPath = req.files?.avatar[0]

    }

    if (req.files && Array.isArray(req.files.coverImage) && req.files.coverImage.length > 0) {
        coverImageLocalPath = req.files?.coverImage[0]
    }

    const avatar = avatarLocalPath
    ? await uploadOnCloudinary(avatarLocalPath.buffer, avatarLocalPath.originalname)
    : null;
    const coverImage = coverImageLocalPath
    ? await uploadOnCloudinary(coverImageLocalPath.buffer, coverImageLocalPath.originalname)
    : null;



    const user = await User.create({
        userName: userName.toLowerCase(),
        email,
        name,
        gender,
        dateOfBirth,
        password,
        avatar: avatar?.url || "",
        coverImage: coverImage?.url || ""
    })

    const createdUser = await User.findById(user._id).select("-password -refreshToken")

    if(!createdUser) {
        throw new ApiError(500, "failed to create User")
    }

    return res.status(201).json(
        new ApiResponse(200, "User created Successfully", createdUser)
    )
})

const loginUser = asyncHandler(async (req, res, next) => {
    const {userName, email, password} = req.body

    if(!(userName || email)) {
        throw new ApiError(400, "userName or email is required")
    }

    const user = await User.findOne({
        $or: [{email}, {userName}]
    })
    

    if(!user) {
        throw new ApiError(404, "user doesn't exist")
    };

    const isPasswordValid = await user.isPasswordCorrect(password);

    if(!isPasswordValid) {
        throw new ApiError(401, "Password is not correct")
    }

    const { accessToken, refreshToken} = await generateAccessAndRefreshToken(user._id)

    const loggedInUser = await User.findById(user._id).select("-password -refreshToken")

    const options = {
        httpOnly: true,
        secure: true
    }

    return res
    .status(200)
    .cookie("AccessToken", accessToken, options)
    .cookie("RefreshToken", refreshToken, options)
    .json (
        new ApiResponse (200,
            {
                user: loggedInUser, accessToken, refreshToken
            },
            "user logged in successfully"
        )
    )
})

const logOutUser = asyncHandler(async (req, res) => {
    await User.findByIdAndUpdate(
        req.user._id, {
            $set: {
                refreshToken: undefined
            }
        }, {
            new: true
        }
    )

    const options = {
        httpOnly: true,
        secure: true
    }

    return res
    .status(200)
    .clearcookie("accessToken", options)
    .clearcookie("refreshToken", options)
    .json(
        new ApiResponse(
            200, null, "user loogged out successfully"
        )
    )
})

const changePassword = asyncHandler(async(req, res) => {
    const {currentPassword, newPassword} = req.body

    const user = await User.findById(req.user?._id)
    const isPasswordValid = await user.isPasswordCorrect(currentPassword)

    if(!isPasswordValid) {
        throw new ApiError(401, "Current password is wrong")
    }

    user.password = newPassword
    await user.save({validateBeforeSave: false})

    return res
    .status(200)
    .json(
        new ApiResponse(200, {}, "Password changed Successfully")
    )
})

const updateUserDetails = asyncHandler(async (req, res, next) => {
  try {
    let avatarLocalPath;
    let coverImageLocalPath;

    if (req.files && Array.isArray(req.files.avatar) && req.files.avatar.length > 0) {
      avatarLocalPath = req.files.avatar[0].path;
    }

    if (req.files && Array.isArray(req.files.coverImage) && req.files.coverImage.length > 0) {
      coverImageLocalPath = req.files.coverImage[0].path;
    }

    // Upload only if file path exists
    if (avatarLocalPath) {
      const avatar = await uploadOnCloudinary(avatarLocalPath);
      req.body.avatar = avatar?.url || "";
    }

    if (coverImageLocalPath) {
      const coverImage = await uploadOnCloudinary(coverImageLocalPath);
      req.body.coverImage = coverImage?.url || "";
    }

    console.log(req.body)

    const updatedUser = await userUpdate(req.user.id, req.body);

    return res
      .status(200)
      .json(new ApiResponse(200, updatedUser, "User updated Successfully"));
  } catch (error) {
    next(error);
  }
});



const refreshAccessToken = asyncHandler(async(req, res) => {
    const incomingRefreshToken = req.cookies.refreshToken || req.body.refreshToken

    if(!incomingRefreshToken) {
        throw new ApiError(401, "Unauthorized Request")
    }

    try {
        const decodedToken = jwt.verify(incomingRefreshToken, process.env.JWT_REFRESH_TOKEN)

        const user = await User.findById(decodedToken?._id)

        if (!user) {
            throw new ApiError(401, "invalid refresh token")
        }

        if(incomingRefreshToken !== user?.refreshToken) {
            throw new ApiError(401, "invalid refresh token")
        }

        const options = {
            httpOnly: true,
            secure: true,
        }

        const {accessToken, newRefreshToken} = await generateAccessAndRefreshTokens(user._id)

        return res
            .status(200)
            .cookie("accessToken", accessToken, options)
            .cookie("refreshToken", newRefreshToken, options)
            .json(
                new ApiResponse(200, {accessToken ,newRefreshToken}, "Access token refreshed successfully")
            )
    } catch (error) {
        throw new ApiError(401, error?.message || "Unauthorized")
    }
})


export {
    registerUser,
    loginUser,
    logOutUser,
    changePassword,
    updateUserDetails,
    refreshAccessToken
}