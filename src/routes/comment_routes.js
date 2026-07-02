import express from "express";

import { delete_comment } from "../controllers/comment_controller.js";

import auth_middleware from "../middlewares/auth_middleware.js";

const router = express.Router();

router.use(auth_middleware);

router.delete("/:comment_id", delete_comment);

export default router;
