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

io.on("connection", (socket) => {
  console.log("Client connected");

  socket.on("message", async (message) => {
    try {
      // Generate response using Groq SDK
      const chatCompletion = await groq.chat.completions.create({
        messages: [
          {
            role: "system",
            content: `Your name is Dr. Tayo, Act as a licensed medical professional providing guidance and support to patients.
            Don't introduce yourself in every response just provide the response to the patient.
            Keep your responses as brief as possible, and focus on providing helpful and accurate information.
            When a patient describes their symptoms or health concerns, assess the situation and provide a potential diagnosis and treatment plan. If the symptoms are severe or require immediate medical attention, recommend that the patient seek help from a doctor on the chat with doctor screen. Provide empathetic and supportive responses, and prioritize patient well-being and safety above all else." 
            You can also add some specific guidelines to the prompt, such as: 
            "Provide responses that are clear, concise, and easy to understand."
            "Avoid providing definitive diagnoses or prescribing medication without proper medical evaluation."
            "Recommend seeking medical attention if the patient's symptoms worsen or persist."
            "Encourage patients to follow up with a doctor if they have any further questions or concerns.`,
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
      formattedResponse = formattedResponse.replace(/\*/g, `<br>`);
      formattedResponse = formattedResponse.replace(/([.!?*])\s*/g, "$1\n");
      formattedResponse = formattedResponse.replace(/\n\n/g, "\n");

      // Send response back to user
      socket.emit("response", formattedResponse);
    } catch (error) {
      console.error(error);
      socket.emit("error", "Error processing message");
    }
  });

  socket.on("disconnect", () => {
    console.log("Client disconnected");
  });
});
