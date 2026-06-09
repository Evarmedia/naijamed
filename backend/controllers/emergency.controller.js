const { EmergencyLog, Case, Patients, User } = require("../models/models");
const { createNotification } = require("../utils/notificationHelper");

// POST /emergencies — trigger emergency
const triggerEmergency = async (req, res) => {
  try {
    const { patient_id, location, latitude, longitude, case_id } = req.body;

    const userId = patient_id || req.user.user_id;

    // Verify user exists
    const user = await User.findByPk(userId);
    if (!user) {
      return res.status(404).json({ message: "Patient not found" });
    }

    const emergency = await EmergencyLog.create({
      patient_id: userId,
      case_id: case_id || null,
      location: location || null,
      latitude: latitude || null,
      longitude: longitude || null,
      status: "triggered",
    });

    // If there's a case, update its classification to emergency
    if (case_id) {
      await Case.update(
        { triage_classification: "emergency", updated_at: new Date() },
        { where: { case_id } }
      );
    }

    // Notify all doctors (in production, would filter by proximity/availability)
    const { Doctors } = require("../models/models");
    const doctors = await Doctors.findAll({
      include: [{ model: User, as: "user", attributes: ["user_id"] }],
    });

    for (const doctor of doctors) {
      await createNotification(
        doctor.user_id,
        "emergency_alert",
        "🚨 Emergency Alert",
        `Emergency triggered by patient ${user.first_name} ${user.last_name}. Location: ${location || "Unknown"}`,
        emergency.emergency_id
      );
    }

    return res.status(201).json({
      message: "Emergency triggered successfully. Help is on the way.",
      emergency,
    });
  } catch (error) {
    console.error("Error triggering emergency:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

// GET /emergencies — get emergency history
const getEmergencies = async (req, res) => {
  try {
    const { patient_id, status, page = 1, limit = 20 } = req.query;

    const where = {};
    if (patient_id) where.patient_id = patient_id;
    if (status) where.status = status;

    // Patients can only see their own emergencies
    if (req.user.role === "patient") {
      where.patient_id = req.user.user_id;
    }

    const offset = (parseInt(page) - 1) * parseInt(limit);

    const { count, rows: emergencies } = await EmergencyLog.findAndCountAll({
      where,
      include: [
        {
          model: User,
          as: "patient",
          attributes: ["user_id", "first_name", "last_name", "phone_number"],
        },
        { model: Case, as: "case" },
      ],
      order: [["created_at", "DESC"]],
      limit: parseInt(limit),
      offset,
    });

    return res.status(200).json({
      emergencies,
      pagination: {
        total: count,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(count / parseInt(limit)),
      },
    });
  } catch (error) {
    console.error("Error fetching emergencies:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

// PUT /emergencies/:id — update emergency status
const updateEmergency = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, responder_notes } = req.body;

    const emergency = await EmergencyLog.findByPk(id);
    if (!emergency) {
      return res.status(404).json({ message: "Emergency not found" });
    }

    const updateData = { updated_at: new Date() };
    if (status) {
      updateData.status = status;
      if (status === "resolved") {
        updateData.resolved_at = new Date();
      }
    }
    if (responder_notes) updateData.responder_notes = responder_notes;

    await EmergencyLog.update(updateData, { where: { emergency_id: id } });

    const updated = await EmergencyLog.findByPk(id);

    return res.status(200).json({
      message: "Emergency updated successfully",
      emergency: updated,
    });
  } catch (error) {
    console.error("Error updating emergency:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

module.exports = {
  triggerEmergency,
  getEmergencies,
  updateEmergency,
};
