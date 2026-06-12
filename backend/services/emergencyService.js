const { Case, EmergencyLog, Doctors, User } = require("../models/models");
const { createNotification } = require("../utils/notificationHelper");

const DOCTOR_BATCH_SIZE = 5;

/**
 * Automatically create an emergency Case + EmergencyLog when the AI detects
 * an emergency (is_emergency: true). Emits "emergency_detected" to the
 * patient's personal socket room so the frontend can show the modal.
 *
 * @param {Object} params
 * @param {Object} params.io              - Socket.IO server instance
 * @param {string} params.user_id         - Patient's user_id
 * @param {Object} params.user            - Patient's User record
 * @param {Object} params.aiData          - Full AI response data object
 * @param {string} params.conversationId  - Current conversation ID
 * @returns {{ emergencyCase, emergencyLog } | null}
 */
const handleEmergencyDetected = async ({
  io,
  user_id,
  user,
  aiData,
  conversationId,
}) => {
  try {
    const diagnosis = aiData.case_summary || null;

    // 1. Create the emergency Case with enriched fields
    const emergencyCase = await Case.create({
      patient_user_id: user_id,
      symptoms: aiData.input || null,
      diagnosis,
      case_type: "emergency",
      severity: "critical",
      requires_physical_care: true,
      triage_classification: "emergency",
      ai_summary: aiData.case_summary || null,
      status: "open",
    });

    // 2. Create EmergencyLog linked to the case
    const emergencyLog = await EmergencyLog.create({
      patient_user_id: user_id,
      case_id: emergencyCase.case_id,
      status: "triggered",
    });

    // 3. Emit "emergency_detected" to patient's personal socket room
    io.to(user_id).emit("emergency_detected", {
      caseId: emergencyCase.case_id,
      emergencyId: emergencyLog.emergency_id,
      diagnosis,
      treatment: aiData.treatment || null,
      conversationId,
    });

    console.log(
      `🚨 Emergency detected for user ${user_id}. Case: ${emergencyCase.case_id}`
    );

    return { emergencyCase, emergencyLog };
  } catch (error) {
    console.error("❌ Error handling emergency detection:", error);
    return null;
  }
};

/**
 * Find all doctors and notify them of an emergency case in batches.
 * Each doctor receives a DB notification and a real-time socket event
 * ("new_emergency_case") on their personal socket room.
 *
 * @param {Object} params
 * @param {Object} params.io
 * @param {string} params.caseId
 * @param {string} params.emergencyId
 * @param {Object} params.patient   - User record of the patient
 * @param {string|null} params.diagnosis
 */
const notifyDoctorsOfEmergency = async ({
  io,
  caseId,
  emergencyId,
  patient,
  diagnosis,
}) => {
  try {
    const doctors = await Doctors.findAll({
      include: [
        {
          model: User,
          as: "user",
          attributes: ["user_id", "first_name", "last_name"],
        },
      ],
    });

    const patientName = `${patient.first_name} ${patient.last_name}`;
    const diagnosisText = diagnosis || "Unknown";

    // Notify in batches to avoid overwhelming the server
    for (let i = 0; i < doctors.length; i += DOCTOR_BATCH_SIZE) {
      const batch = doctors.slice(i, i + DOCTOR_BATCH_SIZE);

      await Promise.all(
        batch.map(async (doctor) => {
          // Persist notification in DB
          await createNotification(
            doctor.user_id,
            "emergency_alert",
            "🚨 Emergency Case — Action Required",
            `Emergency case from ${patientName}. Diagnosis: ${diagnosisText}. Accept to take the case.`,
            caseId
          );

          // Real-time push to doctor's personal socket room
          io.to(doctor.user_id).emit("new_emergency_case", {
            caseId,
            emergencyId,
            patientName,
            diagnosis: diagnosisText,
          });
        })
      );
    }

    console.log(
      `📣 Notified ${doctors.length} doctors of emergency case ${caseId}`
    );
  } catch (error) {
    console.error("❌ Error notifying doctors of emergency:", error);
  }
};

module.exports = { handleEmergencyDetected, notifyDoctorsOfEmergency };
