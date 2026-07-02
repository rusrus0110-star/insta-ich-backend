import mongoose from "mongoose";
import bcrypt from "bcrypt";

const user_schema = new mongoose.Schema(
  {
    username: {
      type: String,
      required: [true, "Username is required"],
      unique: true,
      trim: true,
      lowercase: true,
      minlength: [3, "Username must be at least 3 characters"],
      maxlength: [30, "Username must be less than 30 characters"],
      match: [
        /^[a-zA-Z0-9_.]+$/,
        "Username can contain only letters, numbers, underscores and dots",
      ],
    },

    full_name: {
      type: String,
      required: [true, "Full name is required"],
      trim: true,
      minlength: [2, "Full name must be at least 2 characters"],
      maxlength: [80, "Full name must be less than 80 characters"],
    },

    email: {
      type: String,
      required: [true, "Email is required"],
      unique: true,
      trim: true,
      lowercase: true,
      match: [/^\S+@\S+\.\S+$/, "Please provide a valid email address"],
    },

    password: {
      type: String,
      required: [true, "Password is required"],
      minlength: [6, "Password must be at least 6 characters"],
      select: false,
    },

    bio: {
      type: String,
      trim: true,
      maxlength: [300, "Bio must be less than 300 characters"],
      default: "",
    },

    avatar: {
      type: String,
      default: "",
    },

    followers: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],

    following: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],

    password_reset_token: {
      type: String,
      default: null,
      select: false,
    },

    password_reset_expires: {
      type: Date,
      default: null,
      select: false,
    },
  },
  {
    timestamps: true,
  },
);

user_schema.pre("save", async function () {
  if (!this.isModified("password")) {
    return;
  }

  const salt = await bcrypt.genSalt(12);
  this.password = await bcrypt.hash(this.password, salt);
});

user_schema.methods.compare_password = async function (entered_password) {
  return bcrypt.compare(entered_password, this.password);
};

const User = mongoose.model("User", user_schema);

export default User;
