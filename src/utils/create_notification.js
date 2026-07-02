import Notification from "../models/notification_model.js";

const create_notification = async ({
  recipient,
  sender,
  type,
  post = null,
  comment = null,
}) => {
  if (!recipient || !sender || !type) {
    return null;
  }

  if (String(recipient) === String(sender)) {
    return null;
  }

  const notification = await Notification.create({
    recipient,
    sender,
    type,
    post,
    comment,
  });

  return notification;
};

export default create_notification;
