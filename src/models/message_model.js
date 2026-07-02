import mongoose from "mongoose";

const message_schema = new mongoose.Schema(
  {
    conversation: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Conversation",
      required: [true, "Conversation ID is required"],
      index: true,
    },

    sender: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Message sender is required"],
      index: true,
    },

    text: {
      type: String,
      required: [true, "Message text is required"],
      trim: true,
      minlength: [1, "Message cannot be empty"],
      maxlength: [1000, "Message must be less than 1000 characters"],
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

message_schema.index({ conversation: 1, createdAt: 1 });

const Message = mongoose.model("Message", message_schema);

export default Message;
