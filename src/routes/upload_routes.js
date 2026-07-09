import express from "express";

import { upload_image } from "../controllers/upload_controller.js";
import auth_middleware from "../middlewares/auth_middleware.js";
import upload from "../middlewares/upload_middleware.js";

const router = express.Router();

router.post(
  "/upload/image",
  auth_middleware,
  upload.single("image"),
  upload_image,
);

export default router;
