import { asyncHandler } from "../utils/AsyncHandler.js";
import { Message } from "../models/message.models.js";
import { User } from "../models/user.models.js"
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js"
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import mongoose from "mongoose";
import { io } from "../index.js";

const sendMessages = asyncHandler(async(req, res) => {
    const senderId = req.user.id
    const receiverUserName = req.params.userName
    const { text } = req.body
    
    let imagePath

    if (req.files && Array.isArray(req.files.image) && req.files.image.length > 0) {
        imagePath = req.files?.image[0]
    }

    if (!text && !imagePath) {
        throw new ApiError(404, "Either text or image is required")
    }

    const image = imagePath
    ? await uploadOnCloudinary(imagePath.buffer, imagePath.originalname)
    : null;

    const receiver = await User.findOne({ userName: receiverUserName }).select("_id")

    const message = await Message.create({
        senderId,
        receiverId: receiver._id,
        text: text || "",
        image: image?.url || ""
    })

    io.to(receiver._id.toString()).emit("receiveMessage", {
    senderId,
    receiverId: receiver._id,
    text: text || "",
    image: image?.url || "",
    createdAt: message.createdAt,
  });

    return res
    .status(200)
    .json(
        new ApiResponse(200, message, "message sent successfully")
    )

})

const getMessagedUsers = asyncHandler(async(req, res) => {
    const userId = req.user.id

    const messages = await Message.find({
        $or: [
            {senderId: userId},
            {receiverId: userId}
        ]
    }).select("senderId receiverId")

    if (!messages) {
        throw new ApiError(404, "No messages Found")
    }

    const userIdSets = new Set()

    messages.forEach((msg) => {
        const otherUserId = msg.senderId.toString() === userId.toString()
            ? msg.receiverId.toString()
            : msg.senderId.toString()
        userIdSets.add(otherUserId)
    })

    const uniqueUserIds = Array.from(userIdSets)

    const otherUsers = await User.find({_id: {$in: uniqueUserIds}}).select("name userName avatar")

    return res
    .status(200)
    .json(
        new ApiResponse(200, otherUsers, "Users fetched successfully")
    )

})

const showMessageOfRequestedUser = asyncHandler(async (req, res) => {
  const requestedUserName = req.params.userName;
  const userId = req.user.id;
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 20;

  const requestedUser = await User.findOne({ userName: requestedUserName }).select("_id");
  if (!requestedUser) throw new ApiError(404, "Requested user not found");

  const messages = await Message.find({
    $or: [
      { senderId: userId, receiverId: requestedUser._id },
      { senderId: requestedUser._id, receiverId: userId },
    ],
  })
    .sort({ createdAt: -1 }) // latest first
    .skip((page - 1) * limit)
    .limit(limit)
    .populate("senderId", "userName avatar")
    .populate("receiverId", "userName avatar")
    .select("senderId receiverId text createdAt");

  return res.status(200).json(
    new ApiResponse(200, messages.reverse(), "Messages fetched successfully")
  );
});

const getMessagedUsersWithLastMessage = asyncHandler(async (req, res) => {
  const userId = new mongoose.Types.ObjectId(req.user.id);

  const messages = await Message.aggregate([
    {
      $match: {
        $or: [
          { senderId: userId },
          { receiverId: userId }
        ]
      }
    },
    {
      $addFields: {
        otherUser: {
          $cond: {
            if: { $eq: ["$senderId", userId] },
            then: "$receiverId",
            else: "$senderId"
          }
        }
      }
    },
    {
      $sort: { createdAt: -1 }
    },
    {
      $group: {
        _id: "$otherUser",
        lastMessage: { $first: "$$ROOT" }
      }
    },
    {
      $lookup: {
        from: "users",
        localField: "_id",
        foreignField: "_id",
        as: "userInfo"
      }
    },
    {
      $unwind: "$userInfo"
    },
    {
      $project: {
        _id: 0,
        user: {
          _id: "$userInfo._id",
          name: "$userInfo.name",
          userName: "$userInfo.userName",
          avatar: "$userInfo.avatar"
        },
        lastMessage: {
          text: "$lastMessage.text",
          createdAt: "$lastMessage.createdAt",
          senderId: "$lastMessage.senderId",
          receiverId: "$lastMessage.receiverId"
        }
      }
    },
    {
      $sort: { "lastMessage.createdAt": -1 }
    }
  ]);

  res.status(200).json({
    success: true,
    data: messages
  });
});



export {
    sendMessages,
    getMessagedUsers,
    showMessageOfRequestedUser,
    getMessagedUsersWithLastMessage
}