import mongoose, { Schema } from 'mongoose'

const followSchema = new Schema({
    follower: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true
    },
    following: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true
    }
}, {
    timestamps: true
})

followSchema.index({follower: 1, following: 1}, {unique: true})

export const Follow = mongoose.model("Follow", followSchema)