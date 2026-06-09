const { Conversation, Message, User } = require("../models/models");
const crypto = require("crypto");

// POST /chats/initiate — create a new conversation
const initiateConversation = async (req, res) => {
  try {
    const { type, patient_id, doctor_id, case_id } = req.body;

    if (!type) {
      return res.status(400).json({ message: "Conversation type is required" });
    }

    if (!["patient_ai", "doctor_ai", "patient_doctor"].includes(type)) {
      return res.status(400).json({
        message: "Type must be 'patient_ai', 'doctor_ai', or 'patient_doctor'",
      });
    }

    const conversation = await Conversation.create({
      type,
      patient_id: patient_id || req.user.user_id,
      doctor_id: doctor_id || null,
      case_id: case_id || null,
    });

    return res.status(201).json({
      message: "Conversation initiated successfully",
      conversation,
    });
  } catch (error) {
    console.error("Error initiating conversation:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

// GET /chats/:conversationId/messages
const getMessages = async (req, res) => {
  try {
    const { conversationId } = req.params;
    const { page = 1, limit = 50 } = req.query;

    const conversation = await Conversation.findByPk(conversationId);
    if (!conversation) {
      return res.status(404).json({ message: "Conversation not found" });
    }

    // Verify access — user must be a participant
    if (
      conversation.patient_id !== req.user.user_id &&
      conversation.doctor_id !== req.user.user_id
    ) {
      return res.status(403).json({ message: "Access denied" });
    }

    const offset = (parseInt(page) - 1) * parseInt(limit);

    const { count, rows: messages } = await Message.findAndCountAll({
      where: { conversation_id: conversationId },
      include: [
        {
          model: User,
          as: "user",
          attributes: ["user_id", "first_name", "last_name", "role"],
        },
      ],
      order: [["timestamp", "ASC"]],
      limit: parseInt(limit),
      offset,
    });

    return res.status(200).json({
      conversation_id: conversationId,
      messages,
      pagination: {
        total: count,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(count / parseInt(limit)),
      },
    });
  } catch (error) {
    console.error("Error fetching messages:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

// POST /chats/:conversationId/messages — send a message (REST)
const sendMessage = async (req, res) => {
  try {
    const { conversationId } = req.params;
    const { message, message_type = "text" } = req.body;

    if (!message) {
      return res.status(400).json({ message: "Message content is required" });
    }

    const conversation = await Conversation.findByPk(conversationId);
    if (!conversation) {
      return res.status(404).json({ message: "Conversation not found" });
    }

    if (conversation.status === "closed") {
      return res.status(400).json({ message: "Conversation is closed" });
    }

    // Verify access
    if (
      conversation.patient_id !== req.user.user_id &&
      conversation.doctor_id !== req.user.user_id
    ) {
      return res.status(403).json({ message: "Access denied" });
    }

    const newMessage = await Message.create({
      message_id: `msg-${crypto.randomUUID()}`,
      conversation_id: conversationId,
      user_id: req.user.user_id,
      message,
      message_type,
      identifier: "human",
      sender_role: req.user.role,
      timestamp: new Date(),
    });

    // Update conversation timestamp
    await Conversation.update(
      { updated_at: new Date() },
      { where: { conversation_id: conversationId } }
    );

    return res.status(201).json({
      message: "Message sent successfully",
      data: newMessage,
    });
  } catch (error) {
    console.error("Error sending message:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

// GET /chats — list user's conversations
const listConversations = async (req, res) => {
  try {
    const userId = req.user.user_id;
    const { Op } = require("sequelize");

    const conversations = await Conversation.findAll({
      where: {
        [Op.or]: [{ patient_id: userId }, { doctor_id: userId }],
      },
      include: [
        { model: User, as: "patient", attributes: ["user_id", "first_name", "last_name"] },
        { model: User, as: "doctor", attributes: ["user_id", "first_name", "last_name"] },
      ],
      order: [["updated_at", "DESC"]],
    });

    return res.status(200).json({ conversations });
  } catch (error) {
    console.error("Error listing conversations:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

module.exports = {
  initiateConversation,
  getMessages,
  sendMessage,
  listConversations,
};
