const {
  EmergencyLog,
  Case,
  Patients,
  Doctors,
  User,
  Conversation,
} = require("../models/models");
const { createNotification } = require("../utils/notificationHelper");
const { notifyDoctorsOfEmergency } = require("../services/emergencyService");

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/emergencies — trigger emergency (manual / HTTP trigger)
// ─────────────────────────────────────────────────────────────────────────────
const triggerEmergency = async (req, res) => {
  try {
    const { location, latitude, longitude, case_id } = req.body;

    const user_id = req.user.user_id;

    const user = await User.findByPk(user_id);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const emergency = await EmergencyLog.create({
      patient_user_id: user_id,
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

    // Notify all doctors
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

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/emergencies/confirm/:case_id
// Patient confirms they want to see a doctor after AI detects emergency.
// Kicks off doctor search and batch notifications.
// ─────────────────────────────────────────────────────────────────────────────
const confirmEmergency = async (req, res) => {
  try {
    const { case_id } = req.params;
    const user_id = req.user.user_id;
    const io = req.app.get("io");

    // Verify the case belongs to this patient
    const emergencyCase = await Case.findOne({
      where: { case_id, patient_user_id: user_id },
    });

    if (!emergencyCase) {
      return res.status(404).json({ message: "Emergency case not found" });
    }

    if (emergencyCase.status !== "open") {
      return res
        .status(400)
        .json({ message: "This case is no longer open for assignment" });
    }

    // Find linked emergency log
    const emergencyLog = await EmergencyLog.findOne({
      where: { case_id, patient_user_id: user_id },
      order: [["created_at", "DESC"]],
    });

    if (!emergencyLog) {
      return res.status(404).json({ message: "Emergency log not found" });
    }

    const patient = await User.findByPk(user_id);

    // Notify all available doctors in batches
    await notifyDoctorsOfEmergency({
      io,
      caseId: case_id,
      emergencyId: emergencyLog.emergency_id,
      patient,
      diagnosis: emergencyCase.diagnosis,
    });

    return res.status(200).json({
      message:
        "We are still trying to connect you to a doctor. If your symptoms are severe, worsening, or life-threatening, please contact local emergency services or go to the nearest hospital immediately.",
      caseId: case_id,
      emergencyId: emergencyLog.emergency_id,
    });
  } catch (error) {
    console.error("Error confirming emergency:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/emergencies/decline/:case_id
// Patient declines to see a doctor — cancels the emergency log.
// ─────────────────────────────────────────────────────────────────────────────
const declineEmergency = async (req, res) => {
  try {
    const { case_id } = req.params;
    const user_id = req.user.user_id;

    const emergencyCase = await Case.findOne({
      where: { case_id, patient_user_id: user_id },
    });

    if (!emergencyCase) {
      return res.status(404).json({ message: "Emergency case not found" });
    }

    // Cancel the emergency log
    await EmergencyLog.update(
      { status: "cancelled", updated_at: new Date() },
      { where: { case_id, patient_user_id: user_id } }
    );

    // Close the case
    await Case.update(
      { status: "closed", closed_at: new Date(), updated_at: new Date() },
      { where: { case_id } }
    );

    return res.status(200).json({
      message:
        "Emergency declined. Please monitor your symptoms and seek help if needed.",
      caseId: case_id,
    });
  } catch (error) {
    console.error("Error declining emergency:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/emergencies/accept/:case_id
// Doctor accepts an emergency case:
//   - Assigns themselves to the case
//   - Updates emergency log status to "responded"
//   - Creates a patient <-> doctor conversation linked to the case
//   - Emits "emergency_accepted" to the patient's personal socket room
//   - Notifies the patient via DB notification
// ─────────────────────────────────────────────────────────────────────────────
const acceptEmergency = async (req, res) => {
  try {
    const { case_id } = req.params;
    const doctor_user_id = req.user.user_id;
    const io = req.app.get("io");

    // Verify the doctor profile exists
    const doctor = await Doctors.findOne({ where: { user_id: doctor_user_id } });
    if (!doctor) {
      return res
        .status(403)
        .json({ message: "Only doctors can accept emergency cases" });
    }

    const doctorUser = await User.findByPk(doctor_user_id);

    // Find the open emergency case
    const emergencyCase = await Case.findOne({
      where: { case_id, status: "open", case_type: "emergency" },
    });

    if (!emergencyCase) {
      return res.status(404).json({
        message: "Emergency case not found or already assigned",
      });
    }

    const { patient_user_id } = emergencyCase;

    // 1. Assign doctor to the case
    await Case.update(
      {
        status: "assigned",
        doctor_user_id,
        updated_at: new Date(),
      },
      { where: { case_id } }
    );

    // 2. Mark emergency log as responded
    await EmergencyLog.update(
      { status: "responded", updated_at: new Date() },
      { where: { case_id } }
    );

    // 3. Create a patient <-> doctor conversation linked to this case
    //    (find or create to be safe against duplicate accept clicks)
    let conversation = await Conversation.findOne({
      where: {
        type: "patient_doctor",
        doctor_user_id,
        patient_user_id,
        case_id,
      },
    });

    if (!conversation) {
      conversation = await Conversation.create({
        type: "patient_doctor",
        doctor_user_id,
        patient_user_id,
        case_id,
        created_at: new Date(),
        updated_at: new Date(),
      });
    }

    // 4. Emit "emergency_accepted" to patient's personal socket room
    io.to(patient_user_id).emit("emergency_accepted", {
      caseId: case_id,
      conversationId: conversation.conversation_id,
      doctorName: `Dr. ${doctorUser.first_name} ${doctorUser.last_name}`,
      doctorUserId: doctor_user_id,
      message: `Dr. ${doctorUser.first_name} ${doctorUser.last_name} has accepted your case and is ready to help you.`,
    });

    // 5. Notify the patient via DB notification
    await createNotification(
      patient_user_id,
      "case_assigned",
      "✅ Doctor Assigned",
      `Dr. ${doctorUser.first_name} ${doctorUser.last_name} has accepted your emergency case. You can now chat with them.`,
      case_id
    );

    // 6. Also emit to the doctor so they can join the conversation room on their side
    io.to(doctor_user_id).emit("emergency_case_assigned", {
      caseId: case_id,
      conversationId: conversation.conversation_id,
      patientUserId: patient_user_id,
    });

    return res.status(200).json({
      message: "Emergency case accepted successfully",
      caseId: case_id,
      conversationId: conversation.conversation_id,
      patientUserId: patient_user_id,
    });
  } catch (error) {
    console.error("Error accepting emergency:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/emergencies — get emergency history
// ─────────────────────────────────────────────────────────────────────────────
const getEmergencies = async (req, res) => {
  try {
    const { patient_id, status, page = 1, limit = 20 } = req.query;

    const where = {};
    if (patient_id) where.patient_user_id = patient_id;
    if (status) where.status = status;

    // Patients can only see their own emergencies
    if (req.user.role === "patient") {
      where.patient_user_id = req.user.user_id;
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

// ─────────────────────────────────────────────────────────────────────────────
// PUT /api/emergencies/:id — update emergency status
// ─────────────────────────────────────────────────────────────────────────────
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
  confirmEmergency,
  declineEmergency,
  acceptEmergency,
  getEmergencies,
  updateEmergency,
};
