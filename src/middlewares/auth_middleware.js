import jwt from "jsonwebtoken";
import User from "../models/user_model.js";
import async_handler from "../utils/async_handler.js";

const auth_middleware = async_handler(async (req, res, next) => {
  let token;

  const auth_header = req.headers.authorization;

  if (auth_header && auth_header.startsWith("Bearer ")) {
    token = auth_header.split(" ")[1];
  }

  if (!token) {
    res.status(401);
    throw new Error("Not authorized. Token is missing.");
  }

  if (!process.env.JWT_SECRET) {
    res.status(500);
    throw new Error("JWT_SECRET is missing in environment variables");
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    const user = await User.findById(decoded.user_id).select("-password");

    if (!user) {
      res.status(401);
      throw new Error("Not authorized. User not found.");
    }

    req.user = user;

    next();
  } catch (error) {
    res.status(401);
    throw new Error("Not authorized. Token is invalid or expired.");
  }
});

export default auth_middleware;
