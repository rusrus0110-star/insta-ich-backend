import mongoose from "mongoose";

const notification_schema = new mongoose.Schema(
  {
    recipient: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Notification recipient is required"],
      index: true,
    },

    sender: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Notification sender is required"],
    },

    type: {
      type: String,
      required: [true, "Notification type is required"],
      enum: ["like", "comment", "follow"],
    },

    post: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Post",
      default: null,
    },

    comment: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Comment",
      default: null,
    },

    is_read: {
      type: Boolean,
      default: false,
      index: true,
    },
  },
  {
    timestamps: true,
  },
);

notification_schema.index({ recipient: 1, createdAt: -1 });

const Notification = mongoose.model("Notification", notification_schema);

export default Notification;
