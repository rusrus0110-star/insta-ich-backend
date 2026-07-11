import mongoose from "mongoose";

import Notification from "../models/notification_model.js";
import async_handler from "../utils/async_handler.js";

const is_valid_object_id = (id) => {
  return mongoose.Types.ObjectId.isValid(id);
};

const build_sender_response = (sender) => {
  if (!sender) {
    return null;
  }

  return {
    id: sender._id,
    username: sender.username,
    full_name: sender.full_name,
    avatar: sender.avatar,
  };
};

const build_post_response = (post) => {
  if (!post) {
    return null;
  }

  return {
    id: post._id,
    image: post.image,
    image_url: post.image,
    caption: post.caption || "",
  };
};

const build_comment_response = (comment) => {
  if (!comment) {
    return null;
  }

  return {
    id: comment._id,
    text: comment.text || "",
  };
};

const build_notification_response = (notification) => {
  return {
    id: notification._id,
    type: notification.type,
    is_read: notification.is_read,
    sender: build_sender_response(notification.sender),
    post: build_post_response(notification.post),
    comment: build_comment_response(notification.comment),
    created_at: notification.createdAt,
    updated_at: notification.updatedAt,
  };
};

export const get_notifications = async_handler(async (req, res) => {
  const page = Math.max(Number(req.query.page) || 1, 1);
  const limit = Math.min(Math.max(Number(req.query.limit) || 20, 1), 50);
  const skip = (page - 1) * limit;

  const [notifications, total, unread_count] = await Promise.all([
    Notification.find({ recipient: req.user._id })
      .populate("sender", "username full_name avatar")
      .populate("post", "image caption")
      .populate("comment", "text")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit),

    Notification.countDocuments({ recipient: req.user._id }),

    Notification.countDocuments({
      recipient: req.user._id,
      is_read: false,
    }),
  ]);

  res.status(200).json({
    success: true,
    page,
    limit,
    total,
    pages: Math.ceil(total / limit),
    unread_count,
    count: notifications.length,
    notifications: notifications.map((notification) =>
      build_notification_response(notification),
    ),
  });
});

export const mark_notification_as_read = async_handler(async (req, res) => {
  const { notification_id } = req.params;

  if (!is_valid_object_id(notification_id)) {
    res.status(400);
    throw new Error("Invalid notification ID");
  }

  const notification = await Notification.findOne({
    _id: notification_id,
    recipient: req.user._id,
  })
    .populate("sender", "username full_name avatar")
    .populate("post", "image caption")
    .populate("comment", "text");

  if (!notification) {
    res.status(404);
    throw new Error("Notification not found");
  }

  notification.is_read = true;

  const updated_notification = await notification.save();

  await updated_notification.populate("sender", "username full_name avatar");
  await updated_notification.populate("post", "image caption");
  await updated_notification.populate("comment", "text");

  res.status(200).json({
    success: true,
    message: "Notification marked as read",
    notification: build_notification_response(updated_notification),
  });
});

export const mark_all_notifications_as_read = async_handler(
  async (req, res) => {
    const result = await Notification.updateMany(
      {
        recipient: req.user._id,
        is_read: false,
      },
      {
        $set: {
          is_read: true,
        },
      },
    );

    res.status(200).json({
      success: true,
      message: "All notifications marked as read",
      modified_count: result.modifiedCount,
    });
  },
);

export const delete_notification = async_handler(async (req, res) => {
  const { notification_id } = req.params;

  if (!is_valid_object_id(notification_id)) {
    res.status(400);
    throw new Error("Invalid notification ID");
  }

  const notification = await Notification.findOne({
    _id: notification_id,
    recipient: req.user._id,
  });

  if (!notification) {
    res.status(404);
    throw new Error("Notification not found");
  }

  await notification.deleteOne();

  res.status(200).json({
    success: true,
    message: "Notification deleted successfully",
    notification_id,
  });
});
