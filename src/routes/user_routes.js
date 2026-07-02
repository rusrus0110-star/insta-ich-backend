import express from "express";

import {
  get_user_profile,
  update_current_user_profile,
  search_users,
  toggle_follow_user,
} from "../controllers/user_controller.js";

import auth_middleware from "../middlewares/auth_middleware.js";

const router = express.Router();

router.get("/search", auth_middleware, search_users);
router.put("/profile", auth_middleware, update_current_user_profile);
router.post("/:user_id/follow", auth_middleware, toggle_follow_user);
router.get("/:user_id", auth_middleware, get_user_profile);

export default router;
