import mongoose, { Mongoose, Schema } from 'mongoose'

const messageSchema = new Schema(
    {
        senderId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true
        }, 
        receiverId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true
        },
        text: {
            type: String,
            trim: true
        },
        image: {
            type: String
        }
    },
    {timestamps: true}
)

export const Message = mongoose.model("Message", messageSchema)