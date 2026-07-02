import express from "express";

import {
  create_post,
  get_all_posts,
  get_user_posts,
  get_post_by_id,
  update_post,
  delete_post,
  toggle_post_like,
} from "../controllers/post_controller.js";

import {
  create_comment,
  get_post_comments,
} from "../controllers/comment_controller.js";

import auth_middleware from "../middlewares/auth_middleware.js";

const router = express.Router();

router.use(auth_middleware);

router.post("/", create_post);
router.get("/", get_all_posts);

router.get("/user/:user_id", get_user_posts);

router.post("/:post_id/like", toggle_post_like);

router.post("/:post_id/comments", create_comment);
router.get("/:post_id/comments", get_post_comments);

router.get("/:post_id", get_post_by_id);
router.put("/:post_id", update_post);
router.delete("/:post_id", delete_post);

export default router;
