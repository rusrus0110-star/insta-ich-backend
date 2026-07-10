import mongoose from "mongoose";

import User from "../models/user_model.js";
import async_handler from "../utils/async_handler.js";
import create_notification from "../utils/create_notification.js";

const is_valid_object_id = (id) => {
  return mongoose.Types.ObjectId.isValid(id);
};

const build_user_response = (user, current_user_id = null) => {
  const current_user_id_string = current_user_id
    ? String(current_user_id)
    : null;

  return {
    id: user._id,
    username: user.username,
    full_name: user.full_name,
    email: user.email,
    bio: user.bio || "",
    website: user.website || "",
    avatar: user.avatar || "",
    followers_count: user.followers.length,
    following_count: user.following.length,
    is_current_user: current_user_id_string
      ? String(user._id) === current_user_id_string
      : false,
    is_followed_by_current_user: current_user_id_string
      ? user.followers.some(
          (follower_id) => String(follower_id) === current_user_id_string,
        )
      : false,
    created_at: user.createdAt,
    updated_at: user.updatedAt,
  };
};

function normalize_website(value) {
  const normalized_website = String(value || "").trim();

  if (!normalized_website) {
    return "";
  }

  if (normalized_website.length > 120) {
    throw new Error("Website must be less than 120 characters");
  }

  return normalized_website;
}

function normalize_avatar(value) {
  const normalized_avatar = String(value || "").trim();

  if (!normalized_avatar) {
    return "";
  }

  const is_http_url =
    normalized_avatar.startsWith("http://") ||
    normalized_avatar.startsWith("https://");

  if (!is_http_url) {
    throw new Error("Avatar must be a valid image URL");
  }

  return normalized_avatar;
}

export const get_current_user_profile = async_handler(async (req, res) => {
  const user = await User.findById(req.user._id).select("-password");

  if (!user) {
    res.status(404);
    throw new Error("User not found");
  }

  res.status(200).json({
    success: true,
    user: build_user_response(user, req.user._id),
  });
});

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
    user: build_user_response(user, req.user._id),
  });
});

export const get_user_profile_by_username = async_handler(async (req, res) => {
  const username = String(req.params.username || "")
    .trim()
    .toLowerCase();

  if (!username) {
    res.status(400);
    throw new Error("Username is required");
  }

  const user = await User.findOne({ username }).select("-password");

  if (!user) {
    res.status(404);
    throw new Error("User not found");
  }

  res.status(200).json({
    success: true,
    user: build_user_response(user, req.user._id),
  });
});

export const update_current_user_profile = async_handler(async (req, res) => {
  const { username, full_name, bio, website, avatar } = req.body;

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

  if (website !== undefined) {
    try {
      user.website = normalize_website(website);
    } catch (error) {
      res.status(400);
      throw new Error(error.message);
    }
  }

  if (avatar !== undefined) {
    try {
      user.avatar = normalize_avatar(avatar);
    } catch (error) {
      res.status(400);
      throw new Error(error.message);
    }
  }

  const updated_user = await user.save();

  res.status(200).json({
    success: true,
    message: "Profile updated successfully",
    user: build_user_response(updated_user, req.user._id),
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
    users: users.map((user) => build_user_response(user, req.user._id)),
  });
});

export const toggle_follow_user = async_handler(async (req, res) => {
  const { user_id } = req.params;

  if (!is_valid_object_id(user_id)) {
    res.status(400);
    throw new Error("Invalid user ID");
  }

  if (String(user_id) === String(req.user._id)) {
    res.status(400);
    throw new Error("You cannot follow yourself");
  }

  const target_user = await User.findById(user_id);

  if (!target_user) {
    res.status(404);
    throw new Error("User not found");
  }

  const current_user = await User.findById(req.user._id);

  if (!current_user) {
    res.status(404);
    throw new Error("Current user not found");
  }

  const already_following = current_user.following.some(
    (following_id) => String(following_id) === String(target_user._id),
  );

  if (already_following) {
    current_user.following = current_user.following.filter(
      (following_id) => String(following_id) !== String(target_user._id),
    );

    target_user.followers = target_user.followers.filter(
      (follower_id) => String(follower_id) !== String(current_user._id),
    );
  } else {
    current_user.following.push(target_user._id);
    target_user.followers.push(current_user._id);

    await create_notification({
      recipient: target_user._id,
      sender: current_user._id,
      type: "follow",
    });
  }

  await Promise.all([current_user.save(), target_user.save()]);

  res.status(200).json({
    success: true,
    message: already_following
      ? "User unfollowed successfully"
      : "User followed successfully",
    user: build_user_response(target_user, current_user._id),
  });
});
