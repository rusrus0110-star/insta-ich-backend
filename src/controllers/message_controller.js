import mongoose from "mongoose";

import User from "../models/user_model.js";
import Conversation from "../models/conversation_model.js";
import Message from "../models/message_model.js";
import async_handler from "../utils/async_handler.js";

const is_valid_object_id = (id) => {
  return mongoose.Types.ObjectId.isValid(id);
};

const build_user_preview = (user) => {
  if (!user) {
    return null;
  }

  return {
    id: user._id,
    username: user.username,
    full_name: user.full_name,
    avatar: user.avatar,
  };
};

const build_message_response = (message) => {
  return {
    id: message._id,
    conversation: message.conversation,
    sender: build_user_preview(message.sender),
    text: message.text,
    is_read: message.is_read,
    created_at: message.createdAt,
    updated_at: message.updatedAt,
  };
};

const build_conversation_response = (
  conversation,
  current_user_id,
  unread_count = 0,
) => {
  const other_participants = conversation.participants.filter(
    (participant) => String(participant._id) !== String(current_user_id),
  );

  return {
    id: conversation._id,
    participants: conversation.participants.map((participant) =>
      build_user_preview(participant),
    ),
    other_participant:
      other_participants.length > 0
        ? build_user_preview(other_participants[0])
        : null,
    last_message: conversation.last_message
      ? {
          id: conversation.last_message._id,
          text: conversation.last_message.text,
          sender: build_user_preview(conversation.last_message.sender),
          is_read: conversation.last_message.is_read,
          created_at: conversation.last_message.createdAt,
        }
      : null,
    unread_count,
    created_at: conversation.createdAt,
    updated_at: conversation.updatedAt,
  };
};

const get_unread_counts_map = async (conversation_ids, current_user_id) => {
  if (!conversation_ids.length) {
    return {};
  }

  const result = await Message.aggregate([
    {
      $match: {
        conversation: {
          $in: conversation_ids.map((id) => new mongoose.Types.ObjectId(id)),
        },
        sender: {
          $ne: new mongoose.Types.ObjectId(current_user_id),
        },
        is_read: false,
      },
    },
    {
      $group: {
        _id: "$conversation",
        count: {
          $sum: 1,
        },
      },
    },
  ]);

  return result.reduce((acc, item) => {
    acc[String(item._id)] = item.count;
    return acc;
  }, {});
};

export const get_conversations = async_handler(async (req, res) => {
  const conversations = await Conversation.find({
    participants: req.user._id,
  })
    .populate("participants", "username full_name avatar")
    .populate({
      path: "last_message",
      select: "text sender is_read createdAt updatedAt",
      populate: {
        path: "sender",
        select: "username full_name avatar",
      },
    })
    .sort({ updatedAt: -1 });

  const conversation_ids = conversations.map(
    (conversation) => conversation._id,
  );

  const unread_counts_map = await get_unread_counts_map(
    conversation_ids,
    req.user._id,
  );

  res.status(200).json({
    success: true,
    count: conversations.length,
    conversations: conversations.map((conversation) =>
      build_conversation_response(
        conversation,
        req.user._id,
        unread_counts_map[String(conversation._id)] || 0,
      ),
    ),
  });
});

export const create_or_get_conversation = async_handler(async (req, res) => {
  const { participant_id } = req.body;

  if (!is_valid_object_id(participant_id)) {
    res.status(400);
    throw new Error("Invalid participant ID");
  }

  if (String(participant_id) === String(req.user._id)) {
    res.status(400);
    throw new Error("You cannot create a conversation with yourself");
  }

  const participant = await User.findById(participant_id).select("-password");

  if (!participant) {
    res.status(404);
    throw new Error("Participant not found");
  }

  let conversation = await Conversation.findOne({
    participants: {
      $all: [req.user._id, participant_id],
      $size: 2,
    },
  })
    .populate("participants", "username full_name avatar")
    .populate({
      path: "last_message",
      select: "text sender is_read createdAt updatedAt",
      populate: {
        path: "sender",
        select: "username full_name avatar",
      },
    });

  if (!conversation) {
    conversation = await Conversation.create({
      participants: [req.user._id, participant_id],
    });

    conversation = await Conversation.findById(conversation._id)
      .populate("participants", "username full_name avatar")
      .populate({
        path: "last_message",
        select: "text sender is_read createdAt updatedAt",
        populate: {
          path: "sender",
          select: "username full_name avatar",
        },
      });
  }

  const unread_counts_map = await get_unread_counts_map(
    [conversation._id],
    req.user._id,
  );

  res.status(200).json({
    success: true,
    message: "Conversation ready",
    conversation: build_conversation_response(
      conversation,
      req.user._id,
      unread_counts_map[String(conversation._id)] || 0,
    ),
  });
});

export const get_conversation_messages = async_handler(async (req, res) => {
  const { conversation_id } = req.params;

  if (!is_valid_object_id(conversation_id)) {
    res.status(400);
    throw new Error("Invalid conversation ID");
  }

  const conversation = await Conversation.findOne({
    _id: conversation_id,
    participants: req.user._id,
  });

  if (!conversation) {
    res.status(404);
    throw new Error("Conversation not found");
  }

  const page = Math.max(Number(req.query.page) || 1, 1);
  const limit = Math.min(Math.max(Number(req.query.limit) || 30, 1), 100);
  const skip = (page - 1) * limit;

  const [messages, total] = await Promise.all([
    Message.find({ conversation: conversation._id })
      .populate("sender", "username full_name avatar")
      .sort({ createdAt: 1 })
      .skip(skip)
      .limit(limit),

    Message.countDocuments({ conversation: conversation._id }),
  ]);

  await Message.updateMany(
    {
      conversation: conversation._id,
      sender: {
        $ne: req.user._id,
      },
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
    page,
    limit,
    total,
    pages: Math.ceil(total / limit),
    count: messages.length,
    messages: messages.map((message) => build_message_response(message)),
  });
});

export const send_message = async_handler(async (req, res) => {
  const { conversation_id } = req.params;
  const { text } = req.body;

  if (!is_valid_object_id(conversation_id)) {
    res.status(400);
    throw new Error("Invalid conversation ID");
  }

  const normalized_text = String(text || "").trim();

  if (!normalized_text) {
    res.status(400);
    throw new Error("Message text is required");
  }

  if (normalized_text.length > 1000) {
    res.status(400);
    throw new Error("Message must be less than 1000 characters");
  }

  const conversation = await Conversation.findOne({
    _id: conversation_id,
    participants: req.user._id,
  });

  if (!conversation) {
    res.status(404);
    throw new Error("Conversation not found");
  }

  const message = await Message.create({
    conversation: conversation._id,
    sender: req.user._id,
    text: normalized_text,
  });

  conversation.last_message = message._id;
  await conversation.save();

  const populated_message = await Message.findById(message._id).populate(
    "sender",
    "username full_name avatar",
  );

  res.status(201).json({
    success: true,
    message: "Message sent successfully",
    data: build_message_response(populated_message),
  });
});

export const mark_message_as_read = async_handler(async (req, res) => {
  const { message_id } = req.params;

  if (!is_valid_object_id(message_id)) {
    res.status(400);
    throw new Error("Invalid message ID");
  }

  const message = await Message.findById(message_id).populate(
    "sender",
    "username full_name avatar",
  );

  if (!message) {
    res.status(404);
    throw new Error("Message not found");
  }

  const conversation = await Conversation.findOne({
    _id: message.conversation,
    participants: req.user._id,
  });

  if (!conversation) {
    res.status(403);
    throw new Error("You do not have access to this message");
  }

  if (String(message.sender._id) === String(req.user._id)) {
    res.status(400);
    throw new Error("You cannot mark your own message as read");
  }

  message.is_read = true;

  const updated_message = await message.save();

  res.status(200).json({
    success: true,
    message: "Message marked as read",
    data: build_message_response(updated_message),
  });
});
