import User from "../models/user_model.js";
import generate_token from "../utils/generate_token.js";
import async_handler from "../utils/async_handler.js";

const normalize_email = (email) => {
  return String(email || "")
    .trim()
    .toLowerCase();
};

const normalize_username = (username) => {
  return String(username || "")
    .trim()
    .toLowerCase();
};

export const register_user = async_handler(async (req, res) => {
  const { username, full_name, email, password } = req.body;

  const normalized_email = normalize_email(email);
  const normalized_username = normalize_username(username);

  if (!normalized_username || !full_name || !normalized_email || !password) {
    res.status(400);
    throw new Error("Username, full name, email and password are required");
  }

  if (password.length < 6) {
    res.status(400);
    throw new Error("Password must be at least 6 characters");
  }

  const existing_user = await User.findOne({
    $or: [{ email: normalized_email }, { username: normalized_username }],
  });

  if (existing_user) {
    res.status(409);

    if (existing_user.email === normalized_email) {
      throw new Error("User with this email already exists");
    }

    throw new Error("User with this username already exists");
  }

  const user = await User.create({
    username: normalized_username,
    full_name,
    email: normalized_email,
    password,
  });

  const token = generate_token(user._id);

  res.status(201).json({
    success: true,
    message: "User registered successfully",
    token,
    user: {
      id: user._id,
      username: user.username,
      full_name: user.full_name,
      email: user.email,
      bio: user.bio,
      avatar: user.avatar,
      followers_count: user.followers.length,
      following_count: user.following.length,
      created_at: user.createdAt,
    },
  });
});

export const login_user = async_handler(async (req, res) => {
  const { email, password } = req.body;

  const normalized_email = normalize_email(email);

  if (!normalized_email || !password) {
    res.status(400);
    throw new Error("Email and password are required");
  }

  const user = await User.findOne({ email: normalized_email }).select(
    "+password",
  );

  if (!user) {
    res.status(401);
    throw new Error("Invalid email or password");
  }

  const is_password_valid = await user.compare_password(password);

  if (!is_password_valid) {
    res.status(401);
    throw new Error("Invalid email or password");
  }

  const token = generate_token(user._id);

  res.status(200).json({
    success: true,
    message: "User logged in successfully",
    token,
    user: {
      id: user._id,
      username: user.username,
      full_name: user.full_name,
      email: user.email,
      bio: user.bio,
      avatar: user.avatar,
      followers_count: user.followers.length,
      following_count: user.following.length,
      created_at: user.createdAt,
    },
  });
});

export const get_current_user = async_handler(async (req, res) => {
  const user = await User.findById(req.user._id).select("-password");

  if (!user) {
    res.status(404);
    throw new Error("User not found");
  }

  res.status(200).json({
    success: true,
    user: {
      id: user._id,
      username: user.username,
      full_name: user.full_name,
      email: user.email,
      bio: user.bio,
      avatar: user.avatar,
      followers_count: user.followers.length,
      following_count: user.following.length,
      created_at: user.createdAt,
      updated_at: user.updatedAt,
    },
  });
});
