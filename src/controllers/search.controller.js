import { asyncHandler } from '../utils/AsyncHandler.js'
import { ApiError } from '../utils/ApiError.js'
import { ApiResponse } from '../utils/ApiResponse.js'
import { User } from '../models/user.models.js'

const SearchUser = asyncHandler(async(req, res) => {
    const query = req.query.q

    if (!query) {
        throw new ApiError(403, "Query is required")
    }

    try {
        const regex = new RegExp(query, "i")

        const users = await User.find({
            $or: [{name: regex}, {userName: regex}]
        }).select("name avatar userName")

        if (!users) {
            throw new ApiError(403, "No users found")
        }

        return res
        .status(200)
        .json(
            new ApiResponse(200, users, "users fetched successfully")
        )
    } catch (error) {
        throw new ApiError(404, error)
    }
})

export {
    SearchUser
}