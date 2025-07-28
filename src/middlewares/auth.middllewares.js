import jwt from 'jsonwebtoken'
import { asyncHandler } from '../utils/AsyncHandler.js'
import { User } from '../models/user.models.js'
import { ApiError } from '../utils/ApiError.js'

const verifyJWT = asyncHandler( async(req, _, next) => {
    try {
        const token = req.cookies?.accessToken || req.header("Authorization")?.replace("Bearer ", "")
        if(!token) {
            throw new ApiError(401, "User unauthorized")
        }

        const decodedToken = jwt.verify(token, process.env.JWT_ACCESS_TOKEN)

        const user = await User.findById(decodedToken?._id).select("-password -refreshToken")

        if(!user) {
            throw new ApiError(401, "invalid accessToken")
        }

        req.user = user
        next()
    } catch (error) {
        throw new ApiError(401, error?.message || "Unauthorized")
    }
})

export {verifyJWT}