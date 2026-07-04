import crypto from "crypto";

import User from "../models/user_model.js";
import generate_token from "../utils/generate_token.js";
import async_handler from "../utils/async_handler.js";
import send_email from "../utils/send_email.js";

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

const normalize_login_identifier = (value) => {
  return String(value || "")
    .trim()
    .toLowerCase();
};

const build_auth_user_response = (user) => {
  return {
    id: user._id,
    username: user.username,
    full_name: user.full_name,
    email: user.email,
    bio: user.bio,
    avatar: user.avatar,
    followers_count: user.followers.length,
    following_count: user.following.length,
    created_at: user.createdAt,
  };
};

const get_client_url = (req) => {
  const request_origin = req.get("origin");

  if (request_origin) {
    return request_origin;
  }

  if (process.env.CLIENT_URL) {
    return process.env.CLIENT_URL;
  }

  return "http://localhost:5173";
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
    user: build_auth_user_response(user),
  });
});

export const login_user = async_handler(async (req, res) => {
  const { email, login_identifier, username, password } = req.body;

  const identifier = normalize_login_identifier(
    login_identifier || email || username,
  );

  if (!identifier || !password) {
    res.status(400);
    throw new Error("Username/email and password are required");
  }

  const user = await User.findOne({
    $or: [{ email: identifier }, { username: identifier }],
  }).select("+password");

  if (!user) {
    res.status(401);
    throw new Error("Invalid username/email or password");
  }

  const is_password_valid = await user.compare_password(password);

  if (!is_password_valid) {
    res.status(401);
    throw new Error("Invalid username/email or password");
  }

  const token = generate_token(user._id);

  res.status(200).json({
    success: true,
    message: "User logged in successfully",
    token,
    user: build_auth_user_response(user),
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

export const forgot_password = async_handler(async (req, res) => {
  const { email, login_identifier, username } = req.body;

  const identifier = normalize_login_identifier(
    login_identifier || email || username,
  );

  if (!identifier) {
    res.status(400);
    throw new Error("Email or username is required");
  }

  const user = await User.findOne({
    $or: [{ email: identifier }, { username: identifier }],
  }).select("+password_reset_token +password_reset_expires");

  /*
    Production security:
    Do not reveal whether the account exists.
  */
  if (!user) {
    return res.status(200).json({
      success: true,
      message:
        "If an account with this email or username exists, reset instructions have been sent.",
    });
  }

  const reset_token = crypto.randomBytes(32).toString("hex");

  const hashed_reset_token = crypto
    .createHash("sha256")
    .update(reset_token)
    .digest("hex");

  user.password_reset_token = hashed_reset_token;
  user.password_reset_expires = new Date(Date.now() + 15 * 60 * 1000);

  await user.save({ validateBeforeSave: false });

  const client_url = get_client_url(req);
  const reset_url = `${client_url}/set-new-password?token=${reset_token}`;

  const email_html = `
    <div style="font-family: Arial, sans-serif; line-height: 1.5;">
      <h2>Reset your ICHgram password</h2>

      <p>Hello ${user.full_name || user.username},</p>

      <p>You requested a password reset for your ICHgram account.</p>

      <p>This link is valid for 15 minutes:</p>

      <p>
        <a href="${reset_url}" style="color: #0095f6;">
          Reset your password
        </a>
      </p>

      <p>If the button does not work, copy and paste this link into your browser:</p>

      <p style="word-break: break-all; color: #555;">
        ${reset_url}
      </p>

      <p>If you did not request this, you can ignore this email.</p>
    </div>
  `;

  try {
    await send_email({
      to: user.email,
      subject: "Reset your ICHgram password",
      html: email_html,
    });

    res.status(200).json({
      success: true,
      message:
        "If an account with this email or username exists, reset instructions have been sent.",
    });
  } catch (error) {
    user.password_reset_token = null;
    user.password_reset_expires = null;

    await user.save({ validateBeforeSave: false });

    res.status(500);
    throw new Error("Password reset email could not be sent");
  }
});

export const reset_password = async_handler(async (req, res) => {
  const { reset_token, new_password } = req.body;

  if (!reset_token || !new_password) {
    res.status(400);
    throw new Error("Reset token and new password are required");
  }

  if (String(new_password).length < 6) {
    res.status(400);
    throw new Error("New password must be at least 6 characters");
  }

  const hashed_reset_token = crypto
    .createHash("sha256")
    .update(String(reset_token))
    .digest("hex");

  const user = await User.findOne({
    password_reset_token: hashed_reset_token,
    password_reset_expires: {
      $gt: new Date(),
    },
  }).select("+password_reset_token +password_reset_expires +password");

  if (!user) {
    res.status(400);
    throw new Error("Reset token is invalid or expired");
  }

  user.password = String(new_password);
  user.password_reset_token = null;
  user.password_reset_expires = null;

  await user.save();

  const token = generate_token(user._id);

  res.status(200).json({
    success: true,
    message: "Password has been reset successfully",
    token,
    user: build_auth_user_response(user),
  });
});
