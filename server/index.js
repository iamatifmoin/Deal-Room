import express from "express";
import { createServer } from "http";
import { Server } from "socket.io";
import cors from "cors";
import dotenv from "dotenv";
import mongoose from "mongoose";
import rateLimit from "express-rate-limit";

import connectDB from "./config/database.js";
import authRoutes from "./routes/auth.js";
import dealRoutes from "./routes/deals.js";
import userRoutes from "./routes/users.js";
import documentRoutes from "./routes/documents.js";
import analyticsRoutes from "./routes/analytics.js";
import { authenticateSocket } from "./middleware/auth.js";
import socketHandlers from "./socket/handlers.js";

// Load environment variables first
dotenv.config();

const app = express();
const server = createServer(app);
const allowedOrigin = [
  process.env.CLIENT_URL, // e.g. "https://deal-room-eta.vercel.app"
  "http://localhost:5173",
];

const io = new Server(server, {
  cors: {
    origin: (origin, callback) => {
      if (!origin || allowedOrigin.includes(origin)) {
        callback(null, true);
      } else {
        console.error("❌ Socket.IO CORS not allowed:", origin);
        callback(new Error("Socket.IO CORS not allowed: " + origin));
      }
    },
    credentials: true,
    methods: ["GET", "POST"],
  },
});

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
});

// Middleware
app.use(limiter);
const allowedOrigins = [
  process.env.CLIENT_URL, // e.g. https://your-vercel.vercel.app
  "http://localhost:5173", // local Vite dev frontend
];

app.use(
  cors({
    origin: function (origin, callback) {
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error("❌ CORS not allowed: " + origin));
      }
    },
    credentials: true,
  })
);
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

// Health check endpoint
app.get("/health", (req, res) => {
  res.status(200).json({
    status: "OK",
    timestamp: new Date().toISOString(),
    mongodb:
      mongoose.connection.readyState === 1 ? "connected" : "disconnected",
  });
});

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/deals", dealRoutes);
app.use("/api/users", userRoutes);
app.use("/api/documents", documentRoutes);
app.use("/api/analytics", analyticsRoutes);

// Socket.IO authentication middleware
io.use(authenticateSocket);

// Socket.IO connection handling
io.on("connection", (socket) => {
  console.log(`User ${socket.user.username} connected`);

  socketHandlers(io, socket);

  socket.on("disconnect", () => {
    console.log(`User ${socket.user.username} disconnected`);
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error("Server error:", err.stack);
  res.status(500).json({
    message: "Something went wrong!",
    error:
      process.env.NODE_ENV === "development"
        ? err.message
        : "Internal server error",
  });
});

// Initialize database connection and start server
const startServer = async () => {
  try {
    // Connect to MongoDB first
    await connectDB();

    // Start the server only after successful DB connection
    const PORT = process.env.PORT || 5000;
    server.listen(PORT, () => {
      console.log(`🚀 Server running on port ${PORT}`);
      console.log(
        `📊 Health check available at http://localhost:${PORT}/health`
      );
    });
  } catch (error) {
    console.error("Failed to start server:", error);
    process.exit(1);
  }
};

// Handle graceful shutdown
process.on("SIGINT", async () => {
  console.log("\n🛑 Shutting down server...");
  try {
    await mongoose.connection.close();
    console.log("📦 MongoDB connection closed");
    process.exit(0);
  } catch (error) {
    console.error("Error during shutdown:", error);
    process.exit(1);
  }
});

process.on("SIGTERM", async () => {
  console.log("\n🛑 Shutting down server...");
  try {
    await mongoose.connection.close();
    console.log("📦 MongoDB connection closed");
    process.exit(0);
  } catch (error) {
    console.error("Error during shutdown:", error);
    process.exit(1);
  }
});

// Start the server
startServer();
