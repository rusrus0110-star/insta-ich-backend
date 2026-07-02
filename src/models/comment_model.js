import mongoose from "mongoose";

const comment_schema = new mongoose.Schema(
  {
    post: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Post",
      required: [true, "Post ID is required"],
      index: true,
    },

    author: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Comment author is required"],
      index: true,
    },

    text: {
      type: String,
      required: [true, "Comment text is required"],
      trim: true,
      minlength: [1, "Comment cannot be empty"],
      maxlength: [300, "Comment must be less than 300 characters"],
    },
  },
  {
    timestamps: true,
  },
);

comment_schema.index({ post: 1, createdAt: -1 });

const Comment = mongoose.model("Comment", comment_schema);

export default Comment;
