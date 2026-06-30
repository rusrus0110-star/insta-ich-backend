import mongoose from "mongoose";

import Post from "../models/post_model.js";
import User from "../models/user_model.js";
import async_handler from "../utils/async_handler.js";

const is_valid_object_id = (id) => {
  return mongoose.Types.ObjectId.isValid(id);
};

const is_valid_base64_image = (value) => {
  if (!value || typeof value !== "string") {
    return false;
  }

  return value.trim().startsWith("data:image/");
};

const build_author_response = (author) => {
  if (!author) {
    return null;
  }

  return {
    id: author._id,
    username: author.username,
    full_name: author.full_name,
    avatar: author.avatar,
  };
};

const build_post_response = (post, current_user_id = null) => {
  const current_user_id_string = current_user_id
    ? String(current_user_id)
    : null;

  return {
    id: post._id,
    author: build_author_response(post.author),
    image: post.image,
    caption: post.caption,
    likes_count: post.likes.length,
    is_liked_by_current_user: current_user_id_string
      ? post.likes.some((user_id) => String(user_id) === current_user_id_string)
      : false,
    created_at: post.createdAt,
    updated_at: post.updatedAt,
  };
};

export const create_post = async_handler(async (req, res) => {
  const { image, caption } = req.body;

  if (!image) {
    res.status(400);
    throw new Error("Post image is required");
  }

  if (!is_valid_base64_image(image)) {
    res.status(400);
    throw new Error("Post image must be a valid Base64 image string");
  }

  if (caption !== undefined && String(caption).trim().length > 500) {
    res.status(400);
    throw new Error("Caption must be less than 500 characters");
  }

  const post = await Post.create({
    author: req.user._id,
    image: String(image).trim(),
    caption: caption ? String(caption).trim() : "",
  });

  const populated_post = await Post.findById(post._id).populate(
    "author",
    "username full_name avatar",
  );

  res.status(201).json({
    success: true,
    message: "Post created successfully",
    post: build_post_response(populated_post, req.user._id),
  });
});

export const get_all_posts = async_handler(async (req, res) => {
  const page = Math.max(Number(req.query.page) || 1, 1);
  const limit = Math.min(Math.max(Number(req.query.limit) || 10, 1), 30);
  const skip = (page - 1) * limit;

  const [posts, total] = await Promise.all([
    Post.find()
      .populate("author", "username full_name avatar")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit),
    Post.countDocuments(),
  ]);

  res.status(200).json({
    success: true,
    page,
    limit,
    total,
    pages: Math.ceil(total / limit),
    count: posts.length,
    posts: posts.map((post) => build_post_response(post, req.user._id)),
  });
});

export const get_user_posts = async_handler(async (req, res) => {
  const { user_id } = req.params;

  if (!is_valid_object_id(user_id)) {
    res.status(400);
    throw new Error("Invalid user ID");
  }

  const user_exists = await User.exists({ _id: user_id });

  if (!user_exists) {
    res.status(404);
    throw new Error("User not found");
  }

  const posts = await Post.find({ author: user_id })
    .populate("author", "username full_name avatar")
    .sort({ createdAt: -1 });

  res.status(200).json({
    success: true,
    count: posts.length,
    posts: posts.map((post) => build_post_response(post, req.user._id)),
  });
});

export const get_post_by_id = async_handler(async (req, res) => {
  const { post_id } = req.params;

  if (!is_valid_object_id(post_id)) {
    res.status(400);
    throw new Error("Invalid post ID");
  }

  const post = await Post.findById(post_id).populate(
    "author",
    "username full_name avatar",
  );

  if (!post) {
    res.status(404);
    throw new Error("Post not found");
  }

  res.status(200).json({
    success: true,
    post: build_post_response(post, req.user._id),
  });
});

export const update_post = async_handler(async (req, res) => {
  const { post_id } = req.params;
  const { image, caption } = req.body;

  if (!is_valid_object_id(post_id)) {
    res.status(400);
    throw new Error("Invalid post ID");
  }

  const post = await Post.findById(post_id);

  if (!post) {
    res.status(404);
    throw new Error("Post not found");
  }

  if (String(post.author) !== String(req.user._id)) {
    res.status(403);
    throw new Error("You can update only your own posts");
  }

  if (image !== undefined) {
    if (!is_valid_base64_image(image)) {
      res.status(400);
      throw new Error("Post image must be a valid Base64 image string");
    }

    post.image = String(image).trim();
  }

  if (caption !== undefined) {
    const normalized_caption = String(caption).trim();

    if (normalized_caption.length > 500) {
      res.status(400);
      throw new Error("Caption must be less than 500 characters");
    }

    post.caption = normalized_caption;
  }

  const updated_post = await post.save();

  const populated_post = await Post.findById(updated_post._id).populate(
    "author",
    "username full_name avatar",
  );

  res.status(200).json({
    success: true,
    message: "Post updated successfully",
    post: build_post_response(populated_post, req.user._id),
  });
});

export const delete_post = async_handler(async (req, res) => {
  const { post_id } = req.params;

  if (!is_valid_object_id(post_id)) {
    res.status(400);
    throw new Error("Invalid post ID");
  }

  const post = await Post.findById(post_id);

  if (!post) {
    res.status(404);
    throw new Error("Post not found");
  }

  if (String(post.author) !== String(req.user._id)) {
    res.status(403);
    throw new Error("You can delete only your own posts");
  }

  await post.deleteOne();

  res.status(200).json({
    success: true,
    message: "Post deleted successfully",
  });
});
