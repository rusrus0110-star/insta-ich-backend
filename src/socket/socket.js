import { Server } from "socket.io";
import jwt from "jsonwebtoken";

import User from "../models/user_model.js";
import Conversation from "../models/conversation_model.js";
import Message from "../models/message_model.js";

const connected_users = new Map();

function build_user_preview(user) {
  if (!user) {
    return null;
  }

  return {
    id: user._id,
    username: user.username,
    full_name: user.full_name,
    avatar: user.avatar,
  };
}

function build_message_response(message) {
  return {
    id: message._id,
    conversation: message.conversation,
    sender: build_user_preview(message.sender),
    text: message.text,
    is_read: message.is_read,
    created_at: message.createdAt,
    updated_at: message.updatedAt,
  };
}

function get_allowed_origin(origin) {
  if (!origin) {
    return true;
  }

  try {
    const url = new URL(origin);
    const is_localhost =
      url.hostname === "localhost" || url.hostname === "127.0.0.1";
    const is_vercel_app = url.hostname.endsWith(".vercel.app");

    return is_localhost || is_vercel_app;
  } catch {
    return false;
  }
}

export function initialize_socket(http_server) {
  const io = new Server(http_server, {
    cors: {
      origin: (origin, callback) => {
        if (get_allowed_origin(origin)) {
          callback(null, true);
          return;
        }

        callback(new Error("Not allowed by Socket.io CORS"));
      },
      credentials: true,
    },
  });

  io.use(async (socket, next) => {
    try {
      const token =
        socket.handshake.auth?.token ||
        socket.handshake.headers?.authorization?.replace("Bearer ", "");

      if (!token) {
        return next(new Error("Socket authentication token is missing"));
      }

      if (!process.env.JWT_SECRET) {
        return next(new Error("JWT_SECRET is missing"));
      }

      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      const user = await User.findById(decoded.user_id).select("-password");

      if (!user) {
        return next(new Error("Socket user not found"));
      }

      socket.user = user;
      next();
    } catch {
      next(new Error("Socket authentication failed"));
    }
  });

  io.on("connection", (socket) => {
    const user_id = String(socket.user._id);

    connected_users.set(user_id, socket.id);
    socket.join(user_id);

    socket.emit("socket_connected", {
      success: true,
      user_id,
    });

    socket.on("join_conversation", async ({ conversation_id }, callback) => {
      try {
        const conversation = await Conversation.findOne({
          _id: conversation_id,
          participants: socket.user._id,
        });

        if (!conversation) {
          throw new Error("Conversation not found");
        }

        socket.join(String(conversation._id));

        if (callback) {
          callback({
            success: true,
            conversation_id: String(conversation._id),
          });
        }
      } catch (error) {
        if (callback) {
          callback({
            success: false,
            message: error.message,
          });
        }
      }
    });

    socket.on("send_message", async (payload, callback) => {
      try {
        const conversation_id = payload?.conversation_id;
        const normalized_text = String(payload?.text || "").trim();

        if (!conversation_id) {
          throw new Error("Conversation ID is required");
        }

        if (!normalized_text) {
          throw new Error("Message text is required");
        }

        if (normalized_text.length > 1000) {
          throw new Error("Message must be less than 1000 characters");
        }

        const conversation = await Conversation.findOne({
          _id: conversation_id,
          participants: socket.user._id,
        });

        if (!conversation) {
          throw new Error("Conversation not found");
        }

        const message = await Message.create({
          conversation: conversation._id,
          sender: socket.user._id,
          text: normalized_text,
        });

        conversation.last_message = message._id;
        await conversation.save();

        const populated_message = await Message.findById(message._id).populate(
          "sender",
          "username full_name avatar",
        );

        const message_response = build_message_response(populated_message);

        io.to(String(conversation._id)).emit("receive_message", {
          success: true,
          message: message_response,
        });

        conversation.participants.forEach((participant_id) => {
          io.to(String(participant_id)).emit("conversation_updated", {
            success: true,
            conversation_id: String(conversation._id),
            last_message: message_response,
          });
        });

        if (callback) {
          callback({
            success: true,
            message: message_response,
          });
        }
      } catch (error) {
        if (callback) {
          callback({
            success: false,
            message: error.message,
          });
        }
      }
    });

    socket.on("disconnect", () => {
      connected_users.delete(user_id);
    });
  });

  return io;
}
