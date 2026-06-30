import mongoose from "mongoose";

const connect_db = async () => {
  const mongo_uri = process.env.MONGO_URI;

  if (!mongo_uri) {
    throw new Error("MONGO_URI is missing in environment variables");
  }

  try {
    const connection = await mongoose.connect(mongo_uri);

    console.log(`MongoDB connected: ${connection.connection.host}`);
  } catch (error) {
    console.error("MongoDB connection error:", error.message);
    throw error;
  }
};

export default connect_db;
