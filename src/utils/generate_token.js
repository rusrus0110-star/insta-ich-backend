import jwt from "jsonwebtoken";

const generate_token = (user_id) => {
  if (!process.env.JWT_SECRET) {
    throw new Error("JWT_SECRET is missing in environment variables");
  }

  return jwt.sign(
    {
      user_id,
    },
    process.env.JWT_SECRET,
    {
      expiresIn: process.env.JWT_EXPIRES_IN || "7d",
    },
  );
};

export default generate_token;
