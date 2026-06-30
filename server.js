import dotenv from "dotenv";
import app from "./src/app.js";
import connect_db from "./src/config/db.js";

dotenv.config();

const PORT = process.env.PORT || 5000;

const start_server = async () => {
  try {
    await connect_db();

    app.listen(PORT, () => {
      console.log(`Server is running on port ${PORT}`);
      console.log(`Environment: ${process.env.NODE_ENV || "development"}`);
    });
  } catch (error) {
    console.error("Failed to start server:", error.message);
    process.exit(1);
  }
};

start_server();
