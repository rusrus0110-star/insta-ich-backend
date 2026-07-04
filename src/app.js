import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import rateLimit from "express-rate-limit";

import auth_routes from "./routes/auth_routes.js";
import user_routes from "./routes/user_routes.js";
import post_routes from "./routes/post_routes.js";
import comment_routes from "./routes/comment_routes.js";
import notification_routes from "./routes/notification_routes.js";
import message_routes from "./routes/message_routes.js";

import not_found_middleware from "./middlewares/not_found_middleware.js";
import error_middleware from "./middlewares/error_middleware.js";

const app = express();

app.use(helmet());

const is_allowed_origin = (origin) => {
  if (!origin) {
    return true;
  }

  try {
    const url = new URL(origin);

    const is_localhost =
      url.hostname === "localhost" || url.hostname === "127.0.0.1";

    const is_vercel_app = url.hostname.endsWith(".vercel.app");

    return is_localhost || is_vercel_app;
  } catch {
    return false;
  }
};

app.use(
  cors({
    origin: (origin, callback) => {
      if (is_allowed_origin(origin)) {
        callback(null, true);
        return;
      }

      callback(new Error("Not allowed by CORS"));
    },
    credentials: true,
  }),
);

app.use(express.json({ limit: "5mb" }));
app.use(express.urlencoded({ extended: true }));

if (process.env.NODE_ENV === "development") {
  app.use(morgan("dev"));
}

const auth_limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: "Too many requests. Please try again later.",
  },
});

app.get("/api/health", (req, res) => {
  res.status(200).json({
    success: true,
    message: "API is running",
  });
});

app.use("/api/auth", auth_limiter, auth_routes);
app.use("/api/users", user_routes);
app.use("/api/posts", post_routes);
app.use("/api/comments", comment_routes);
app.use("/api/notifications", notification_routes);
app.use("/api", message_routes);

app.use(not_found_middleware);
app.use(error_middleware);

export default app;
