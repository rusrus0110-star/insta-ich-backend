import mongoose from "mongoose";

import Post from "../models/post_model.js";
import Comment from "../models/comment_model.js";
import async_handler from "../utils/async_handler.js";
import create_notification from "../utils/create_notification.js";

const is_valid_object_id = (id) => {
  return mongoose.Types.ObjectId.isValid(id);
};

const build_comment_response = (comment) => {
  return {
    id: comment._id,
    post: comment.post,
    author: {
      id: comment.author._id,
      username: comment.author.username,
      full_name: comment.author.full_name,
      avatar: comment.author.avatar,
    },
    text: comment.text,
    created_at: comment.createdAt,
    updated_at: comment.updatedAt,
  };
};

export const create_comment = async_handler(async (req, res) => {
  const { post_id } = req.params;
  const { text } = req.body;

  if (!is_valid_object_id(post_id)) {
    res.status(400);
    throw new Error("Invalid post ID");
  }

  const normalized_text = String(text || "").trim();

  if (!normalized_text) {
    res.status(400);
    throw new Error("Comment text is required");
  }

  if (normalized_text.length > 300) {
    res.status(400);
    throw new Error("Comment must be less than 300 characters");
  }

  const post = await Post.findById(post_id);

  if (!post) {
    res.status(404);
    throw new Error("Post not found");
  }

  const comment = await Comment.create({
    post: post._id,
    author: req.user._id,
    text: normalized_text,
  });

  if (String(post.author) !== String(req.user._id)) {
    await create_notification({
      recipient: post.author,
      sender: req.user._id,
      type: "comment",
      post: post._id,
      comment: comment._id,
    });
  }

  const populated_comment = await Comment.findById(comment._id).populate(
    "author",
    "username full_name avatar",
  );

  res.status(201).json({
    success: true,
    message: "Comment created successfully",
    comment: build_comment_response(populated_comment),
  });
});

export const get_post_comments = async_handler(async (req, res) => {
  const { post_id } = req.params;

  if (!is_valid_object_id(post_id)) {
    res.status(400);
    throw new Error("Invalid post ID");
  }

  const post_exists = await Post.exists({ _id: post_id });

  if (!post_exists) {
    res.status(404);
    throw new Error("Post not found");
  }

  const page = Math.max(Number(req.query.page) || 1, 1);
  const limit = Math.min(Math.max(Number(req.query.limit) || 20, 1), 50);
  const skip = (page - 1) * limit;

  const [comments, total] = await Promise.all([
    Comment.find({ post: post_id })
      .populate("author", "username full_name avatar")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit),

    Comment.countDocuments({ post: post_id }),
  ]);

  res.status(200).json({
    success: true,
    page,
    limit,
    total,
    pages: Math.ceil(total / limit),
    count: comments.length,
    comments: comments.map((comment) => build_comment_response(comment)),
  });
});

export const delete_comment = async_handler(async (req, res) => {
  const { comment_id } = req.params;

  if (!is_valid_object_id(comment_id)) {
    res.status(400);
    throw new Error("Invalid comment ID");
  }

  const comment = await Comment.findById(comment_id);

  if (!comment) {
    res.status(404);
    throw new Error("Comment not found");
  }

  const post = await Post.findById(comment.post);

  if (!post) {
    res.status(404);
    throw new Error("Post not found");
  }

  const is_comment_author = String(comment.author) === String(req.user._id);
  const is_post_author = String(post.author) === String(req.user._id);

  if (!is_comment_author && !is_post_author) {
    res.status(403);
    throw new Error("You can delete only your own comments");
  }

  await comment.deleteOne();

  res.status(200).json({
    success: true,
    message: "Comment deleted successfully",
    comment_id,
  });
});
