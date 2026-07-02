import express from "express";

import {
  get_conversations,
  create_or_get_conversation,
  get_conversation_messages,
  send_message,
  mark_message_as_read,
} from "../controllers/message_controller.js";

import auth_middleware from "../middlewares/auth_middleware.js";

const router = express.Router();

router.use(auth_middleware);

router.get("/conversations", get_conversations);
router.post("/conversations", create_or_get_conversation);

router.get(
  "/conversations/:conversation_id/messages",
  get_conversation_messages,
);
router.post("/conversations/:conversation_id/messages", send_message);

router.patch("/messages/:message_id/read", mark_message_as_read);

export default router;
