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

  return Notification.create({
    recipient,
    sender,
    type,
    post,
    comment,
  });
}