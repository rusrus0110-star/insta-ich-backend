import express from "express";

import {
  get_user_profile,
  update_current_user_profile,
  search_users,
} from "../controllers/user_controller.js";

import auth_middleware from "../middlewares/auth_middleware.js";

const router = express.Router();

router.get("/search", auth_middleware, search_users);
router.put("/profile", auth_middleware, update_current_user_profile);
router.get("/:user_id", auth_middleware, get_user_profile);

export default router;
