import { User } from "../models/user.models.js";
import { ApiError } from "../utils/ApiError.js";

export const userUpdate = async (userId, updates = {}) => {
  const filteredUpdates = {};

  if (updates.avatar) {
    filteredUpdates.avatar = updates.avatar.trim().toLowerCase();
  }

  if (updates.coverImage) {
    filteredUpdates.coverImage = updates.coverImage.trim().toLowerCase();
  }

  if (updates.name?.trim()) {
    filteredUpdates.name = updates.name.trim();
  }

  if (updates.bio?.trim()) {
    filteredUpdates.bio = updates.bio.trim();
  }

  if (updates.location?.trim()) {
    filteredUpdates.location = updates.location.trim();
  }

  if (Object.keys(filteredUpdates).length === 0) {
    throw new ApiError(402, "No fields provided for updation");
  }

  const updatedUser = await User.findOneAndUpdate(
    { _id: userId },
    { $set: filteredUpdates },
    { new: true, runValidators: true }
  ).select("-password -refreshToken");

  if (!updatedUser) {
    throw new ApiError(402, "User not found");
  }

  return updatedUser;
};
