require("dotenv").config(); // Load environment variables
const express = require("express");
const path = require("path");
const cors = require("cors");
const helmet = require("helmet");
const crypto = require("crypto");
const axios = require("axios");

const sequelize = require("./config/db");
const { authenticateUser } = require("./middleware/authMiddleware");
const { Message, Conversation } = require("./models/models");

const { apiLimiter } = require("./middleware/rateLimiter");

// Route imports
const authRoutes = require("./routes/auth.route");
const userRoutes = require("./routes/user.route");
const caseRoutes = require("./routes/case.route");
const chatRoutes = require("./routes/chat.route");
const aiRoutes = require("./routes/ai.route");
const prescriptionRoutes = require("./routes/prescription.route");
const notificationRoutes = require("./routes/notification.route");
const emergencyRoutes = require("./routes/emergency.route");

const app = express();
const PORT = process.env.PORT || 3005;

const server = require("http").createServer(app);
const io = require("socket.io")(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST", "PUT", "DELETE"],
    credentials: true,
  },
});

// Middleware
app.use(helmet({
  crossOriginResourcePolicy: false, // allow images to load cross-origin
}));
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(apiLimiter); // Apply general rate limiting

// Serve uploaded profile photos
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// Swagger docs
const swaggerUi = require("swagger-ui-express");
const specs = require("./swagger");
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(specs));

// API Routes
app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/cases", caseRoutes);
app.use("/api/chats", chatRoutes);
app.use("/api/ai", aiRoutes);
app.use("/api", prescriptionRoutes); // Uses /cases/:caseId/prescriptions
app.use("/api/notifications", notificationRoutes);
app.use("/api/emergencies", emergencyRoutes);

// Test server response
app.get("/", (req, res) => {
  res.json({ message: "Welcome to NaijaMED Assistant API" });
});

// Database Connection & Server Start
(async () => {
  try {
    await sequelize.authenticate();
    console.log("Database connected successfully.");

    // Sync all models (alter: true updates schema without dropping existing data)
    await sequelize.sync({ alter: true });
    console.log("Database synced");

    // Start the server
    server.listen(PORT, () => {
      console.log(`Server is running on http://localhost:${PORT}`);
      console.log(`Swagger Docs available at http://localhost:${PORT}/api-docs`);
    });
  } catch (error) {
    console.error("Unable to connect to the database or start server:", error);
  }
})();

// Real-time Chat via Socket.IO
io.on("connection", async (socket) => {
  console.log("Client connected via WebSocket");

  // Handshake authentication
  const token = socket.handshake.auth?.token;
  if (!token) {
    socket.emit("error", "Authentication token is required");
    socket.disconnect(true);
    return;
  }

  const user_id = await authenticateUser(token);
  if (!user_id) {
    socket.emit("error", "Invalid or expired token. Please log in again.");
    socket.disconnect(true);
    return;
  }

  // Join a conversation room
  socket.on("join_conversation", async (conversationId) => {
    socket.join(conversationId);
    console.log(`User ${user_id} joined conversation ${conversationId}`);
  });

  socket.on("message", async (data) => {
    try {
      const { conversationId, message, type = "patient_ai" } = data;

      if (!message) {
        socket.emit("error", "Message content is required");
        return;
      }

      // If conversationId is provided, verify it exists. Otherwise, look for an active one or create it.
      let conversation;
      if (conversationId) {
        conversation = await Conversation.findByPk(conversationId);
        if (!conversation) {
          socket.emit("error", "Conversation not found");
          return;
        }
      } else {
        // Create a new conversation if none specified (for AI chat)
        conversation = await Conversation.create({
          type: type,
          patient_id: user_id, // Defaulting patient to sender; if doctor, ideally explicitly passed
        });
      }

      // 1. Save the HUMAN message
      const humanMessage = await Message.create({
        message_id: `msg-${crypto.randomUUID()}`,
        conversation_id: conversation.conversation_id,
        user_id,
        message: message,
        identifier: "human",
        sender_role: "patient", // Could derive from token role if needed
        timestamp: new Date(),
      });

      // Broadcast to room
      io.to(conversation.conversation_id).emit("new_message", humanMessage);

      // 2. If it's an AI conversation, get AI response
      if (conversation.type === "patient_ai" || conversation.type === "doctor_ai") {
        // Fetch message history for AI context
        const messageHistory = await Message.findAll({
          where: { conversation_id: conversation.conversation_id },
          order: [["timestamp", "ASC"]],
          limit: 20,
        });

        const formattedHistory = messageHistory.map((msg) => ({
          message_id: msg.message_id,
          user_id: msg.user_id,
          message: msg.message,
          identifier: msg.identifier,
          timestamp: msg.timestamp,
        }));

        const AI_SERVICE_URL = process.env.AI_SERVICE_URL || "https://mommap-ai.onrender.com/api/v1/chat/";
        let aiResponseText = "Sorry, the AI service is currently unavailable.";

        try {
          const response = await axios.post(
            `${AI_SERVICE_URL}?user_id=${user_id}&message=${encodeURIComponent(message)}`,
            formattedHistory
          );
          aiResponseText = response.data?.response || aiResponseText;
        } catch (error) {
          console.error("AI service error in WebSocket:", error.message);
        }

        // Save AI message
        const aiMessage = await Message.create({
          message_id: `msg-${crypto.randomUUID()}`,
          conversation_id: conversation.conversation_id,
          user_id, // Attributing to the user's thread
          message: aiResponseText,
          identifier: "agent",
          sender_role: "ai",
          timestamp: new Date(),
        });

        // Broadcast AI response to room
        io.to(conversation.conversation_id).emit("new_message", aiMessage);
      }

      // Update conversation timestamp
      await conversation.update({ updated_at: new Date() });

    } catch (error) {
      console.error("Socket message error:", error);
      socket.emit("error", "Failed to process message");
    }
  });

  socket.on("disconnect", () => {
    console.log("Client disconnected");
  });
});