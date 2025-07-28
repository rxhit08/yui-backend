import mongoose, { Schema } from 'mongoose'


const repliesSchema = new Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true
    },
    text: {
        type: String,
        required: true
    },
    likes: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: "User"
    }],
    taggedUsers: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        default: null
    }],
    createdAt: {
        type: Date,
        default: Date.now
    }
})


const commentSchema = new Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true
        }, 
    text: {
        type: String,
        required: true
    },
    likes: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: "User"
    }],
    replies: [
        repliesSchema
    ],
    createdAt: {
            type: Date,
            default: Date.now
    }
})

const postSchema = new Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true
    },
    caption: {
        type: String,
        trim: true
    },
    image: {
        type: String,
    },
    likes: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: "User"
    }],
    comments: [
        commentSchema
    ],
    createdAt: {
    type: Date,
    default: Date.now,
  },
},{
    timeStamps: true
})

export const Post = mongoose.model("Post", postSchema)