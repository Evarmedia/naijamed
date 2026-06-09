const axios = require("axios");
const { Message, Conversation } = require("../models/models");
const crypto = require("crypto");

const AI_SERVICE_URL =
  process.env.AI_SERVICE_URL || "https://mommap-ai.onrender.com/api/v1/chat/";

// POST /ai/triage — AI triage assessment
const triage = async (req, res) => {
  try {
    const { symptoms, duration, severity, associated_symptoms } = req.body;

    if (!symptoms) {
      return res.status(400).json({ message: "Symptoms are required" });
    }

    const triagePrompt = `You are a medical triage AI assistant for NaijaMed. Analyze the following patient symptoms and provide a structured triage assessment.

Patient presents with:
- Primary symptoms: ${symptoms}
- Duration: ${duration || "Not specified"}
- Severity: ${severity || "Not specified"}
- Associated symptoms: ${associated_symptoms || "None"}

Please respond in the following JSON format ONLY:
{
  "classification": "<Mild|Moderate|Severe|Emergency>",
  "summary": "<SOAP format assessment>",
  "recommended_action": "<What the patient should do next>",
  "urgency_score": <1-10>
}`;

    const user_id = req.user.user_id;

    // Fetch message history
    const messageHistory = await Message.findAll({
      where: { user_id },
      order: [["timestamp", "ASC"]],
      limit: 10,
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
      const response = await axios.post(
        `${AI_SERVICE_URL}?user_id=${user_id}&message=${encodeURIComponent(triagePrompt)}`,
        messageHistoryArray
      );
      aiResponse = response.data.response;
    } catch (apiError) {
      console.error("AI service error:", apiError.message);
      return res.status(503).json({ message: "AI service temporarily unavailable" });
    }

    // Try to parse as JSON, fallback to raw text
    let parsedResponse;
    try {
      parsedResponse = JSON.parse(aiResponse);
    } catch {
      parsedResponse = {
        classification: "moderate",
        summary: aiResponse,
        recommended_action: "Please consult a healthcare professional",
        urgency_score: 5,
      };
    }

    return res.status(200).json({
      message: "Triage assessment completed",
      triage: parsedResponse,
    });
  } catch (error) {
    console.error("Triage error:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

// POST /ai/patient-assistant — Patient-facing AI assistant
const patientAssistant = async (req, res) => {
  try {
    const { question } = req.body;

    if (!question) {
      return res.status(400).json({ message: "Question is required" });
    }

    const user_id = req.user.user_id;

    const prompt = `You are NaijaMed Health Assistant, a friendly and empathetic AI health companion designed for Nigerian patients. 
Respond in simple, plain language that any patient can understand. Avoid medical jargon. 
Be culturally aware of Nigerian healthcare context.
If the question seems like an emergency, strongly advise the patient to call emergency services or go to the nearest hospital immediately.

Patient question: ${question}`;

    const messageHistory = await Message.findAll({
      where: { user_id },
      order: [["timestamp", "ASC"]],
      limit: 20,
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
      const response = await axios.post(
        `${AI_SERVICE_URL}?user_id=${user_id}&message=${encodeURIComponent(prompt)}`,
        messageHistoryArray
      );
      aiResponse = response.data.response;
    } catch (apiError) {
      console.error("AI service error:", apiError.message);
      return res.status(503).json({ message: "AI service temporarily unavailable" });
    }

    // Save messages to DB
    await Message.create({
      message_id: `msg-${crypto.randomUUID()}`,
      user_id,
      message: question,
      identifier: "human",
      sender_role: "patient",
      timestamp: new Date(),
    });

    await Message.create({
      message_id: `msg-${crypto.randomUUID()}`,
      user_id,
      message: aiResponse,
      identifier: "agent",
      sender_role: "ai",
      timestamp: new Date(),
    });

    return res.status(200).json({
      message: "Response generated",
      response: aiResponse,
    });
  } catch (error) {
    console.error("Patient assistant error:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

// POST /ai/doctor-assistant — Doctor-facing AI assistant
const doctorAssistant = async (req, res) => {
  try {
    const { question } = req.body;

    if (!question) {
      return res.status(400).json({ message: "Question is required" });
    }

    const user_id = req.user.user_id;

    const prompt = `You are NaijaMed Clinical Assistant, an AI assistant designed specifically for medical doctors.
Respond using appropriate clinical terminology and evidence-based medical knowledge.
Reference relevant clinical guidelines, drug interactions, and differential diagnoses when applicable.
Format responses in a structured clinical manner (SOAP format when appropriate).

Doctor's query: ${question}`;

    const messageHistory = await Message.findAll({
      where: { user_id },
      order: [["timestamp", "ASC"]],
      limit: 20,
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
      const response = await axios.post(
        `${AI_SERVICE_URL}?user_id=${user_id}&message=${encodeURIComponent(prompt)}`,
        messageHistoryArray
      );
      aiResponse = response.data.response;
    } catch (apiError) {
      console.error("AI service error:", apiError.message);
      return res.status(503).json({ message: "AI service temporarily unavailable" });
    }

    // Save messages to DB
    await Message.create({
      message_id: `msg-${crypto.randomUUID()}`,
      user_id,
      message: question,
      identifier: "human",
      sender_role: "doctor",
      timestamp: new Date(),
    });

    await Message.create({
      message_id: `msg-${crypto.randomUUID()}`,
      user_id,
      message: aiResponse,
      identifier: "agent",
      sender_role: "ai",
      timestamp: new Date(),
    });

    return res.status(200).json({
      message: "Response generated",
      response: aiResponse,
    });
  } catch (error) {
    console.error("Doctor assistant error:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

module.exports = {
  triage,
  patientAssistant,
  doctorAssistant,
};
