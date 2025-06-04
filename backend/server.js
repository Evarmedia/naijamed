require("dotenv").config(); // Load environment variables
const express = require("express");
const sequelize = require("./config/db");
const authRoutes = require("./routes/auth.route");
const userRoutes = require("./routes/user.route");
const { authenticateUser } = require("./middleware/authMiddleware");
const { Message } = require("./models/models");

const { Groq } = require("groq-sdk");
const groq = new Groq();

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

    // Sync database models (you can set { alter: true } or { force: true } in development)
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

io.on("connection", async (socket) => {
  console.log("Client connected");

  // Authenticate user
  const user_id = await authenticateUser(socket.handshake.auth.token);
  console.log(`User authenticated with ID: ${user_id}`);

  if (!user_id) {
    socket.disconnect(true);
    return;
  }
  socket.on("message", async (message) => {
    try {
      // Store user message in database
      const userMessage = await Message.create({
        message_id: `msg-${crypto.randomUUID()}`,
        user_id: user_id,
        message: message,
        timestamp: new Date(),
        identifier: "human",
      });

      // Generate response using Groq SDK
      const chatCompletion = await groq.chat.completions.create({
        messages: [
          {
            role: "system",
            content: `Your name is Dr. Tayo, Act as a licensed medical professional providing guidance and support to patients. 
            Keep your as brief as possible, and focus on providing helpful and accurate information.
            When a patient describes their symptoms or health concerns, assess the situation and provide a potential diagnosis and treatment plan. If the symptoms are severe or require immediate medical attention, recommend that the patient seek help from a doctor on the chat with doctor screen. Provide empathetic and supportive responses, and prioritize patient well-being and safety above all else." 
            You can also add some specific guidelines to the prompt, such as: 
            "Provide responses that are clear, concise, and easy to understand."
            "Avoid providing definitive diagnoses or prescribing medication without proper medical evaluation."
            "Recommend seeking medical attention if the patient's symptoms worsen or persist."
            "Encourage patients to follow up with a doctor if they have any further questions or concerns.
            Unless asked to, You dont need to introduce yourself in every reponse, just the first one is fine.`,
          },
          {
            role: "user",
            content: message,
          },
        ],
        model: "meta-llama/llama-4-scout-17b-16e-instruct",
        temperature: 1,
        max_completion_tokens: 1024,
        top_p: 1,
        stream: true,
        stop: null,
      });

      let response = "";
      for await (const chunk of chatCompletion) {
        response += chunk.choices[0]?.delta?.content || "";
      }

      // Clean up response
      let formattedResponse = response.replace(/###/g, "\n\n**");
      formattedResponse = formattedResponse.replace(/\*/g, "•");
      formattedResponse = formattedResponse.replace(/([.!?*])\s*/g, "$1\n");
      formattedResponse = formattedResponse.replace(/\n\n/g, "\n");

      // Store AI response in database
      await Message.create({
        message_id: `msg-${crypto.randomUUID()}`,
        user_id: user_id,
        message: formattedResponse,
        timestamp: new Date(),
        identifier: "agent",
      });

      // Send response back to user
      socket.emit("response", response);
    } catch (error) {
      console.error(error);
      socket.emit("error", "Error processing message");
    }
  });

  socket.on("disconnect", () => {
    console.log("Client disconnected");
  });
});
