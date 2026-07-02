import express from "express";

import {
  register_user,
  login_user,
  get_current_user,
  forgot_password,
  reset_password,
} from "../controllers/auth_controller.js";

import auth_middleware from "../middlewares/auth_middleware.js";

const router = express.Router();

router.post("/register", register_user);
router.post("/login", login_user);

router.post("/forgot-password", forgot_password);
router.post("/reset-password", reset_password);

router.get("/me", auth_middleware, get_current_user);

export default router;
