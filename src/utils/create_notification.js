import Notification from "../models/notification_model.js";

export default async function create_notification({
  recipient,
  sender,
  type,
  post = null,
  comment = null,
}) {
  if (!recipient || !sender || !type) {
    return null;
  }

  if (String(recipient) === String(sender)) {
    return null;
  }

  if (type === "follow") {
    return Notification.findOneAndUpdate(
      {
        recipient,
        sender,
        type: "follow",
      },
      {
        $set: {
          recipient,
          sender,
          type: "follow",
          post: null,
          comment: null,
          is_read: false,
        },
      },
      {
        upsert: true,
        new: true,
        setDefaultsOnInsert: true,
      },
    );
  }

  if (type === "like") {
    if (!post) {
      return null;
    }

    return Notification.findOneAndUpdate(
      {
        recipient,
        sender,
        type: "like",
        post,
      },
      {
        $set: {
          recipient,
          sender,
          type: "like",
          post,
          comment: null,
          is_read: false,
        },
      },
      {
        upsert: true,
        new: true,
        setDefaultsOnInsert: true,
      },
    );
  }

  if (type === "comment") {
    if (!post || !comment) {
      return null;
    }

    return Notification.findOneAndUpdate(
      {
        recipient,
        sender,
        type: "comment",
        post,
        comment,
      },
      {
        $setOnInsert: {
          recipient,
          sender,
          type: "comment",
          post,
          comment,
          is_read: false,
        },
      },
      {
        upsert: true,
        new: true,
        setDefaultsOnInsert: true,
      },
    );
  }

  return null;
}
