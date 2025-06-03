require("dotenv").config(); // Load environment variables
const express = require("express");
const sequelize = require("./config/db"); // Import the Sequelize instance
const authRoutes = require("./routes/auth.route");
const userRoutes = require("./routes/user.route");

const app = express();
const PORT = process.env.PORT || 3005;
const cors = require("cors");

// Middleware for parsing JSON
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors());

const swaggerUi = require("swagger-ui-express");
const specs = require("./swagger");

app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(specs));

// Routes
app.use("/api/auth", authRoutes); // authentication routes
app.use("/api/users", userRoutes); // User routes

// Test server response
app.get("/", (req, res) => {
  res.json({ message: "hello Okada-connect" });
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
    app.listen(PORT, () => {
      console.log(`Server is running on http://localhost:${PORT}`);
      console.log(`Server is running on http://localhost:${PORT}/api-docs`);
    });
  } catch (error) {
    console.error("Unable to connect to the database:", error);
  }
})();
