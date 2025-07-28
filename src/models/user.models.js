import mongoose, {Schema} from 'mongoose'
import bcrypt from 'bcrypt'
import jwt from 'jsonwebtoken'
import { asyncHandler } from '../utils/AsyncHandler.js'
import { ApiError } from '../utils/ApiError.js'

const userSchema = new Schema(
    {
        userName: {
            type: String,
            required: true,
            trim: true,
            unique: true,
            index: true,
            lowerCase: true
        }, 
        email: {
            type: String,
            required: true,
            unique: true,
            lowerCase: true,
            trim: true
        },
        name: {
            type: String,
            required: true,
        },
        avatar: {
            type: String,
        },
        coverImage: {
            type: String
        },
        bio: {
            type: String,
            trim: true,
            maxlength: 200,
            default: ""
        },
        location: {
             type: String,
             default: "",
             trim: true
        },
        dateOfBirth: {
            type: Date,
            required: true
        },
        gender: {
            type: String,
            enum: ['male', 'female', 'other']
        }, 
        password: {
            type: String,
            required: [true, 'Password is required'],
            minlength: [8, 'password must be 8 characters long'] 
        },
        refreshToken: {
            type: String
        }
    },
    {timestamps: true}
)

userSchema.pre("save", async function(next) {
    if(!this.isModified("password")) return next();

    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(this.password, saltRounds)
    this.password = hashedPassword
    next()
})

userSchema.methods.isPasswordCorrect = async function (password) {
    return await bcrypt.compare(password, this.password);
}

userSchema.methods.generateAccessToken = function() {
    return jwt.sign(
        {
            id: this._id,
            userName: this.userName,
            name: this.name,
            email: this.email
        },
        process.env.JWT_ACCESS_TOKEN,
        {
            expiresIn: process.env.JWT_ACCESS_EXPIRY
        }
    )
}

userSchema.methods.generateRefreshToken = function() {
    return jwt.sign(
        {
            id: this._id
        },
        process.env.JWT_REFRESH_TOKEN,
        {
            expiresIn: process.env.JWT_REFRESH_EXPIRY
        }
    )
}



export const User = mongoose.model("User", userSchema)