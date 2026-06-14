require("dotenv").config();

const express = require("express");
const path = require("path");
const cors = require("cors");
const helmet = require("helmet");
const crypto = require("crypto");
const axios = require("axios");
const { Op } = require("sequelize");

const sequelize = require("./config/db");
const { authenticateUser } = require("./middleware/authMiddleware");

const {
  Message,
  Conversation,
  User,
  Doctors,
  Patients,
  Prescription,
} = require("./models/models");

const { apiLimiter } = require("./middleware/rateLimiter");

// Emergency service — handles auto-case creation and doctor notifications
const { handleEmergencyDetected } = require("./services/emergencyService");

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
const PORT = process.env.PORT || 3055;

const server = require("http").createServer(app);

const io = require("socket.io")(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST", "PUT", "DELETE"],
    credentials: true,
  },
});

// Expose io on the app so controllers can access it via req.app.get('io')
app.set("io", io);

// Middleware
app.use(
  helmet({
    crossOriginResourcePolicy: false,
  })
);

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(apiLimiter);

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
app.use("/api", prescriptionRoutes);
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

    // Sync all models if needed
    // await sequelize.sync({ alter: true });

    console.log("Database synced");

    server.listen(PORT, () => {
      console.log(`starting server in ${process.env.NODE_ENV} mode...`);
      console.log(`Server is running on http://localhost:${PORT}`);
      console.log(`Swagger Docs available at http://localhost:${PORT}/api-docs`);
    });
  } catch (error) {
    console.error("Unable to connect to the database or start server:", error);
  }
})();

// ─────────────────────────────────────────────────────────────────────────────
// Socket.IO Helpers
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Get user role profile (doctor / patient).
 */
const getUserProfile = async (user_id) => {
  const doctor = await Doctors.findOne({ where: { user_id } });
  const patient = await Patients.findOne({ where: { user_id } });

  return {
    doctor,
    patient,
    isDoctor: !!doctor,
    isPatient: !!patient,
    role: doctor ? "doctor" : patient ? "patient" : "user",
  };
};

/**
 * Check if a user is a member of a conversation.
 * Conversation stores patient_user_id and doctor_user_id as user_id values.
 */
const isConversationMember = (conversation, user_id) => {
  return (
    conversation.patient_user_id === user_id ||
    conversation.doctor_user_id === user_id
  );
};

/**
 * Resolve or create a Patient <-> Doctor conversation.
 *
 * Patient payload: { conversationType: "patient_doctor", doctorUserId, message }
 * Doctor payload:  { conversationType: "patient_doctor", patientUserId, message }
 */
const getOrCreatePatientDoctorConversation = async ({
  user_id,
  isDoctor,
  isPatient,
  doctorUserId,
  patientUserId,
  caseId,
  transaction,
}) => {
  let finalDoctorUserId = doctorUserId;
  let finalPatientUserId = patientUserId;

  if (isPatient) {
    finalPatientUserId = user_id;

    if (!finalDoctorUserId) {
      throw new Error("doctorUserId is required for patient-doctor chat");
    }

    const doctorExists = await Doctors.findOne({
      where: { user_id: finalDoctorUserId },
      transaction,
    });

    if (!doctorExists) {
      throw new Error("Doctor not found");
    }
  }

  if (isDoctor) {
    finalDoctorUserId = user_id;

    if (!finalPatientUserId) {
      throw new Error("patientUserId is required for patient-doctor chat");
    }

    const patientExists = await Patients.findOne({
      where: { user_id: finalPatientUserId },
      transaction,
    });

    if (!patientExists) {
      throw new Error("Patient not found");
    }
  }

  if (!finalDoctorUserId || !finalPatientUserId) {
    throw new Error("Both doctorUserId and patientUserId are required");
  }

  let conversation = await Conversation.findOne({
    where: {
      type: "patient_doctor",
      doctor_user_id: finalDoctorUserId,
      patient_user_id: finalPatientUserId,
    },
    transaction,
  });

  if (!conversation) {
    conversation = await Conversation.create(
      {
        type: "patient_doctor",
        doctor_user_id: finalDoctorUserId,
        patient_user_id: finalPatientUserId,
        case_id: caseId || null,
        created_at: new Date(),
        updated_at: new Date(),
      },
      { transaction }
    );
  }

  return conversation;
};

/**
 * Fetch limited message history for AI context.
 */
const getFormattedMessageHistory = async (conversationId, transaction) => {
  const messageHistory = await Message.findAll({
    where: { conversation_id: conversationId },
    order: [["timestamp", "ASC"]],
    limit: 20,
    transaction,
  });

  return messageHistory.map((msg) => ({
    message_id: msg.message_id,
    user_id: msg.user_id,
    message: msg.message,
    identifier: msg.identifier,
    sender_role: msg.sender_role,
    timestamp: msg.timestamp,
    created_at: msg.created_at,
  }));
};

/**
 * Call the AI service and return the full response data object.
 * Returns { response, diagnosis, treatment, is_emergency, ... } or a fallback.
 */
const callAIService = async ({ isPatient, user_id, message, chat_history }) => {
  const PATIENT_AI_SERVICE_URL =
    process.env.PATIENT_AI_SERVICE_URL ||
    "https://mommap-ai.onrender.com/api/v1/chat/";

  const DOC_AI_SERVICE_URL =
    process.env.DOC_AI_SERVICE_URL ||
    "https://mommap-ai.onrender.com/api/v1/chat/doctor";

  const AI_SERVICE_URL = isPatient
    ? PATIENT_AI_SERVICE_URL
    : DOC_AI_SERVICE_URL;

  const fallback = {
    response: "AI service unavailable",
    is_emergency: false,
    diagnosis: null,
    treatment: null,
  };

  try {
    console.log(
      `Calling AI service for user ${user_id} with message: ${message}`
    );

    const response = await axios.post(
      AI_SERVICE_URL,
      {
        user_id,
        message,
        chat_history,
      },
      {
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
        },
        // timeout: 10_000,
      }
    );

    console.log("AI Response data:", response.data);

    // Return the complete AI data object so callers can use is_emergency, diagnosis, etc.
    return response.data || fallback;
  } catch (error) {
    console.error("AI service error in WebSocket:", error.message);

    if (error.response) {
      console.error("AI service error details:", error.response.data);
    }

    return fallback;
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// Real-time Chat via Socket.IO
// ─────────────────────────────────────────────────────────────────────────────

io.on("connection", async (socket) => {
  console.log("Client connected via WebSocket");

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

  socket.data.user_id = user_id;

  // Join a personal room keyed by user_id so controllers can push
  // targeted events (emergency alerts, doctor acceptance, etc.)
  socket.join(user_id);

  // Per-socket rate limiting
  let messageCount = 0;
  const MAX_MESSAGES_PER_MINUTE = 60;

  const resetInterval = setInterval(() => {
    messageCount = 0;
  }, 60_000);

  // ── join_conversation ─────────────────────────────────────────────────────

  socket.on("join_conversation", async (conversationId) => {
    try {
      if (!conversationId) {
        socket.emit("error", "conversationId is required");
        return;
      }

      const conversation = await Conversation.findByPk(conversationId);

      if (!conversation) {
        socket.emit("error", "Conversation not found");
        return;
      }

      if (!isConversationMember(conversation, user_id)) {
        socket.emit("error", "Not a member of this conversation");
        return;
      }

      socket.join(conversation.conversation_id);

      console.log(
        `User ${user_id} joined conversation ${conversation.conversation_id}`
      );

      socket.emit("conversation_joined", {
        conversationId: conversation.conversation_id,
        type: conversation.type,
      });
    } catch (error) {
      console.error("Join conversation error:", error);
      socket.emit("error", "Failed to join conversation");
    }
  });

  // ── start_patient_doctor_conversation ────────────────────────────────────

  /**
   * Patient sends: { doctorUserId }
   * Doctor sends:  { patientUserId }
   */
  socket.on("start_patient_doctor_conversation", async (data) => {
    const transaction = await sequelize.transaction();

    try {
      const { doctorUserId, patientUserId } = data || {};

      const { isDoctor, isPatient } = await getUserProfile(user_id);

      if (!isDoctor && !isPatient) {
        await transaction.rollback();
        socket.emit(
          "error",
          "Only doctors or patients can start conversations"
        );
        return;
      }

      const conversation = await getOrCreatePatientDoctorConversation({
        user_id,
        isDoctor,
        isPatient,
        doctorUserId,
        patientUserId,
        transaction,
      });

      await transaction.commit();

      socket.join(conversation.conversation_id);

      socket.emit("conversation_started", {
        conversationId: conversation.conversation_id,
        type: conversation.type,
        doctor_user_id: conversation.doctor_user_id,
        patient_user_id: conversation.patient_user_id,
      });

      console.log(
        `Patient-doctor conversation started: ${conversation.conversation_id}`
      );
    } catch (error) {
      await transaction.rollback();

      console.error(
        "Start patient-doctor conversation error:",
        error.message
      );
      socket.emit("error", error.message || "Failed to start conversation");
    }
  });

  // ── message ───────────────────────────────────────────────────────────────

  /**
   * Existing AI chat (no conversationId):  { message }
   * Existing conversation:                 { conversationId, message }
   * New patient-doctor (patient side):     { conversationType: "patient_doctor", doctorUserId, message }
   * New patient-doctor (doctor side):      { conversationType: "patient_doctor", patientUserId, message }
   */
  socket.on("message", async (data) => {
    let transaction;

    try {
      if (++messageCount > MAX_MESSAGES_PER_MINUTE) {
        socket.emit("error", "Rate limit exceeded");
        return;
      }

      const {
        conversationId: incomingConversationId,
        conversationType,
        doctorUserId,
        patientUserId,
        message,
      } = data || {};

      if (!message || typeof message !== "string" || !message.trim()) {
        socket.emit("error", "Message content is required");
        return;
      }

      const cleanMessage = message.trim();

      const { isDoctor, isPatient } = await getUserProfile(user_id);

      if (!isDoctor && !isPatient) {
        socket.emit(
          "error",
          "Only doctors or patients can send chat messages"
        );
        return;
      }

      transaction = await sequelize.transaction();

      let conversation;
      let conversationId = incomingConversationId;

      // CASE 1: Existing conversation
      if (conversationId) {
        conversation = await Conversation.findByPk(conversationId, {
          transaction,
        });

        if (!conversation) {
          throw new Error("Conversation not found");
        }

        if (!isConversationMember(conversation, user_id)) {
          throw new Error("Not a member of this conversation");
        }
      }

      // CASE 2: New Patient <-> Doctor conversation
      if (!conversation && conversationType === "patient_doctor") {
        conversation = await getOrCreatePatientDoctorConversation({
          user_id,
          isDoctor,
          isPatient,
          doctorUserId,
          patientUserId,
          transaction,
        });

        conversationId = conversation.conversation_id;
      }

      // CASE 3: No conversation supplied — create AI conversation
      if (!conversation) {
        conversation = await Conversation.create(
          {
            type: isDoctor ? "doctor_ai" : "patient_ai",
            doctor_user_id: isDoctor ? user_id : null,
            patient_user_id: isPatient ? user_id : null,
            created_at: new Date(),
            updated_at: new Date(),
          },
          { transaction }
        );

        conversationId = conversation.conversation_id;
      }

      // Enforce conversation type access rules
      if (
        conversation.type === "patient_ai" &&
        (!isPatient || conversation.patient_user_id !== user_id)
      ) {
        throw new Error("Access denied for patient AI conversation");
      }

      if (
        conversation.type === "doctor_ai" &&
        (!isDoctor || conversation.doctor_user_id !== user_id)
      ) {
        throw new Error("Access denied for doctor AI conversation");
      }

      if (
        conversation.type === "patient_doctor" &&
        !isConversationMember(conversation, user_id)
      ) {
        throw new Error("Access denied for patient-doctor conversation");
      }

      socket.join(conversationId);

      const senderRole = isPatient ? "patient" : "doctor";

      // Save the human message
      const humanMessage = await Message.create(
        {
          message_id: `msg-${crypto.randomUUID()}`,
          conversation_id: conversationId,
          user_id,
          message: cleanMessage,
          identifier: "human",
          sender_role: senderRole,
          timestamp: new Date(),
          created_at: new Date(),
          updated_at: new Date(),
        },
        { transaction }
      );

      await conversation.update(
        { updated_at: new Date() },
        { transaction }
      );

      // Commit human message first — real messages are saved even if AI fails
      await transaction.commit();
      transaction = null;

      io.to(conversationId).emit("new_message", humanMessage);

      // Patient-doctor chat: stop here, no AI response
      if (conversation.type === "patient_doctor") {
        io.to(conversationId).emit("message_delivered", {
          conversationId,
          messageId: humanMessage.message_id,
        });

        return;
      }

      // ── AI conversations (patient_ai / doctor_ai) ─────────────────────────

      if (
        conversation.type === "patient_ai" ||
        conversation.type === "doctor_ai"
      ) {
        io.to(conversationId).emit("typing", { conversationId });

        const aiTransaction = await sequelize.transaction();

        try {
          const formattedHistory = await getFormattedMessageHistory(
            conversationId,
            aiTransaction
          );

          // callAIService now returns the full AI data object
          const aiData = await callAIService({
            isPatient,
            user_id,
            message: cleanMessage,
            chat_history: formattedHistory,
          });

          const aiResponseText = aiData.response || "AI service unavailable";

          const aiMessage = await Message.create(
            {
              message_id: `msg-${crypto.randomUUID()}`,
              conversation_id: conversationId,
              user_id,
              message: aiResponseText,
              identifier: "agent",
              sender_role: "ai",
              timestamp: new Date(),
              created_at: new Date(),
              updated_at: new Date(),
            },
            { transaction: aiTransaction }
          );

          await conversation.update(
            { updated_at: new Date() },
            { transaction: aiTransaction }
          );

          await aiTransaction.commit();

          io.to(conversationId).emit("typing_stopped", { conversationId });
          io.to(conversationId).emit("new_message", aiMessage);

          // ── Emergency detection ─────────────────────────────────────────────
          // Only trigger for patient_ai conversations where the AI flags is_emergency
          if (aiData.is_emergency === true && isPatient) {
            const user = await User.findByPk(user_id);

            await handleEmergencyDetected({
              io,
              user_id,
              user,
              aiData,
              conversationId,
            });
          }
        } catch (error) {
          await aiTransaction.rollback();

          console.error("AI message transaction error:", error);

          io.to(conversationId).emit("typing_stopped", { conversationId });
          socket.emit("error", "AI response failed");
        }
      }
    } catch (error) {
      if (transaction) {
        await transaction.rollback();
      }

      console.error("Socket message error:", error);
      socket.emit("error", error.message || "Failed to process message");
    }
  });

  // ── typing ────────────────────────────────────────────────────────────────

  socket.on("typing", async (data) => {
    try {
      const { conversationId } = data || {};

      if (!conversationId) {
        socket.emit("error", "conversationId is required");
        return;
      }

      const conversation = await Conversation.findByPk(conversationId);

      if (!conversation) {
        socket.emit("error", "Conversation not found");
        return;
      }

      if (!isConversationMember(conversation, user_id)) {
        socket.emit("error", "Not a member of this conversation");
        return;
      }

      socket.to(conversationId).emit("typing", {
        conversationId,
        user_id,
      });
    } catch (error) {
      console.error("Typing event error:", error);
    }
  });

  // ── typing_stopped ────────────────────────────────────────────────────────

  socket.on("typing_stopped", async (data) => {
    try {
      const { conversationId } = data || {};

      if (!conversationId) {
        socket.emit("error", "conversationId is required");
        return;
      }

      const conversation = await Conversation.findByPk(conversationId);

      if (!conversation) {
        socket.emit("error", "Conversation not found");
        return;
      }

      if (!isConversationMember(conversation, user_id)) {
        socket.emit("error", "Not a member of this conversation");
        return;
      }

      socket.to(conversationId).emit("typing_stopped", {
        conversationId,
        user_id,
      });
    } catch (error) {
      console.error("Typing stopped event error:", error);
    }
  });

  // ── disconnect ────────────────────────────────────────────────────────────

  socket.on("disconnect", () => {
    clearInterval(resetInterval);
    console.log(`Client ${user_id} disconnected`);
  });
});