import mongoose from "mongoose";

const conversation_schema = new mongoose.Schema(
  {
    participants: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
      },
    ],

    last_message: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Message",
      default: null,
    },
  },
  {
    timestamps: true,
  },
);

conversation_schema.index({ participants: 1 });
conversation_schema.index({ updatedAt: -1 });

const Conversation = mongoose.model("Conversation", conversation_schema);

export default Conversation;
