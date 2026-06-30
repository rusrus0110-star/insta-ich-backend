import mongoose from "mongoose";

import User from "../models/user_model.js";
import async_handler from "../utils/async_handler.js";

const is_valid_object_id = (id) => {
  return mongoose.Types.ObjectId.isValid(id);
};

const build_user_response = (user) => {
  return {
    id: user._id,
    username: user.username,
    full_name: user.full_name,
    email: user.email,
    bio: user.bio,
    avatar: user.avatar,
    followers_count: user.followers.length,
    following_count: user.following.length,
    created_at: user.createdAt,
    updated_at: user.updatedAt,
  };
};

export const get_user_profile = async_handler(async (req, res) => {
  const { user_id } = req.params;

  if (!is_valid_object_id(user_id)) {
    res.status(400);
    throw new Error("Invalid user ID");
  }

  const user = await User.findById(user_id).select("-password");

  if (!user) {
    res.status(404);
    throw new Error("User not found");
  }

  res.status(200).json({
    success: true,
    user: build_user_response(user),
  });
});

export const update_current_user_profile = async_handler(async (req, res) => {
  const { username, full_name, bio, avatar } = req.body;

  const user = await User.findById(req.user._id);

  if (!user) {
    res.status(404);
    throw new Error("User not found");
  }

  if (username !== undefined) {
    const normalized_username = String(username).trim().toLowerCase();

    if (normalized_username.length < 3 || normalized_username.length > 30) {
      res.status(400);
      throw new Error("Username must be between 3 and 30 characters");
    }

    const username_regex = /^[a-zA-Z0-9_.]+$/;

    if (!username_regex.test(normalized_username)) {
      res.status(400);
      throw new Error(
        "Username can contain only letters, numbers, underscores and dots",
      );
    }

    const existing_user = await User.findOne({
      username: normalized_username,
      _id: { $ne: user._id },
    });

    if (existing_user) {
      res.status(409);
      throw new Error("Username is already taken");
    }

    user.username = normalized_username;
  }

  if (full_name !== undefined) {
    const normalized_full_name = String(full_name).trim();

    if (normalized_full_name.length < 2 || normalized_full_name.length > 80) {
      res.status(400);
      throw new Error("Full name must be between 2 and 80 characters");
    }

    user.full_name = normalized_full_name;
  }

  if (bio !== undefined) {
    const normalized_bio = String(bio).trim();

    if (normalized_bio.length > 300) {
      res.status(400);
      throw new Error("Bio must be less than 300 characters");
    }

    user.bio = normalized_bio;
  }

  if (avatar !== undefined) {
    const normalized_avatar = String(avatar).trim();

    if (normalized_avatar && !normalized_avatar.startsWith("data:image/")) {
      res.status(400);
      throw new Error("Avatar must be a valid Base64 image string");
    }

    user.avatar = normalized_avatar;
  }

  const updated_user = await user.save();

  res.status(200).json({
    success: true,
    message: "Profile updated successfully",
    user: build_user_response(updated_user),
  });
});

export const search_users = async_handler(async (req, res) => {
  const query = String(req.query.query || "").trim();

  if (!query) {
    res.status(400);
    throw new Error("Search query is required");
  }

  if (query.length < 2) {
    res.status(400);
    throw new Error("Search query must be at least 2 characters");
  }

  const users = await User.find({
    $or: [
      { username: { $regex: query, $options: "i" } },
      { full_name: { $regex: query, $options: "i" } },
    ],
  })
    .select("-password -email")
    .limit(20)
    .sort({ username: 1 });

  res.status(200).json({
    success: true,
    count: users.length,
    users: users.map((user) => ({
      id: user._id,
      username: user.username,
      full_name: user.full_name,
      bio: user.bio,
      avatar: user.avatar,
      followers_count: user.followers.length,
      following_count: user.following.length,
    })),
  });
});
