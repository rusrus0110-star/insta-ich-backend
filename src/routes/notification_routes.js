import express from "express";

import {
  get_notifications,
  mark_notification_as_read,
  mark_all_notifications_as_read,
  delete_notification,
} from "../controllers/notification_controller.js";

import auth_middleware from "../middlewares/auth_middleware.js";

const router = express.Router();

router.use(auth_middleware);

router.get("/", get_notifications);
router.patch("/read-all", mark_all_notifications_as_read);
router.patch("/:notification_id/read", mark_notification_as_read);
router.delete("/:notification_id", delete_notification);

export default router;
