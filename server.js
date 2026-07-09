import http from "http";
import dotenv from "dotenv";

import app from "./src/app.js";
import connect_db from "./src/config/db.js";
import { initialize_socket } from "./src/socket/socket.js";

dotenv.config();

const PORT = process.env.PORT || 5000;

const start_server = async () => {
  try {
    await connect_db();

    const http_server = http.createServer(app);

    initialize_socket(http_server);

    http_server.listen(PORT, () => {
      console.log(`Server is running on port ${PORT}`);
      console.log(`Environment: ${process.env.NODE_ENV || "development"}`);
      console.log("Socket.io is ready");
    });
  } catch (error) {
    console.error("Failed to start server:", error.message);
    process.exit(1);
  }
};

start_server();
