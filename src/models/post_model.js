import mongoose from "mongoose";

const post_schema = new mongoose.Schema(
  {
    author: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Post author is required"],
      index: true,
    },

    image: {
      type: String,
      required: [true, "Post image is required"],
      trim: true,
    },

    public_id: {
      type: String,
      trim: true,
      default: "",
    },

    caption: {
      type: String,
      trim: true,
      maxlength: [2200, "Caption must be less than 2200 characters"],
      default: "",
    },

    likes: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],
  },
  {
    timestamps: true,
  },
);

post_schema.index({ createdAt: -1 });
post_schema.index({ author: 1, createdAt: -1 });

const Post = mongoose.model("Post", post_schema);

export default Post;
