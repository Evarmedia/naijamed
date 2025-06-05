require("dotenv").config(); // Load environment variables
const express = require("express");
const sequelize = require("./config/db");
const authRoutes = require("./routes/auth.route");
const userRoutes = require("./routes/user.route");
const { authenticateUser } = require("./middleware/authMiddleware");
const { Message } = require("./models/models");
const axios = require("axios");

// const { Groq } = require("groq-sdk");
// const groq = new Groq();

const app = express();
const PORT = process.env.PORT || 3005;
// const cors = require("cors");

const server = require("http").createServer(app);
const io = require("socket.io")(server, {
  cors: {
    // origin: "http://127.0.0.1:5500",
    origin: "*",
    methods: ["GET", "POST"],
    credentials: true,
  },
});
// const llama = require('./services/llama');

// Middleware for parsing JSON
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
// app.use(cors());

const swaggerUi = require("swagger-ui-express");
const specs = require("./swagger");

app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(specs));

// Routes
app.use("/api/auth", authRoutes); // authentication routes
app.use("/api/users", userRoutes); // User routes

// Test server response
app.get("/", (req, res) => {
  res.json({ message: "hello NaijaMED Assisitant" });
});

// Test the database connection and sync models
(async () => {
  try {
    await sequelize.authenticate();
    console.log("Database connected successfully.");

    sequelize
      .sync()
      .then(() => console.log("Database synced"))
      .catch((error) => console.log("Error syncing database:", error));

    // Start the server
    server.listen(PORT, () => {
      console.log(`Server is running on http://localhost:${PORT}`);
      console.log(`Server is running on http://localhost:${PORT}/api-docs`);
    });
  } catch (error) {
    console.error("Unable to connect to the database:", error);
  }
})();

// Sending and recieving messages  using socketio
io.on("connection", async (socket) => {
  console.log("Client connected");

  // Authenticate user
  const user_id = await authenticateUser(socket.handshake.auth.token);
  if (!user_id) {
    console.log('Please log in');
    socket.emit("error", "You must be logged in to send messages");
    socket.disconnect(true);
    return;
  }

  socket.on("message", async (message) => {
    try {
      if (!user_id) {
        socket.emit("error", "Invalid user ID. Please log in again");
        return;
      }

      // Fetch message history for the user
      const messageHistory = await Message.findAll({
        where: { user_id },
        order: [["timestamp", "ASC"]],
      });

      const messageHistoryArray = messageHistory.map((msg) => ({
        message_id: msg.message_id,
        user_id: msg.user_id,
        message: msg.message,
        identifier: msg.identifier,
        timestamp: msg.timestamp,
        created_at: msg.created_at,
      }));

      let aiResponse;
      try {
        // Call the microservice endpoint
        const response = await axios.post(
          `https://mommap-ai.onrender.com/api/v1/chat/?user_id=${user_id}&message=${encodeURIComponent(
            message
          )}`,
          messageHistoryArray
        );
        aiResponse = response.data.response;
      } catch (error) {
        console.error(error.response.data);
        socket.emit("error", "Error processing message");
        return;
      }

      // Save the user's message and AI response to the database
      await Message.create({
        message_id: `msg-${crypto.randomUUID()}`,
        user_id,
        message: message,
        timestamp: new Date(),
        identifier: "human",
      });

      await Message.create({
        message_id: `msg-${crypto.randomUUID()}`,
        user_id,
        message: aiResponse, 
        timestamp: new Date(),
        identifier: "agent",
      });

      // Send response back to user
      socket.emit("response", aiResponse);
    } catch (error) {
      console.error(error);
      socket.emit("error", "Error processing message");
    }
  });

  socket.on("disconnect", () => {
    console.log("Client disconnected");
  });
});