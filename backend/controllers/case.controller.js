const { Case, Patients, Doctors, User } = require("../models/models");
const { createNotification } = require("../utils/notificationHelper");
const { Op } = require("sequelize");

// POST /cases — create a new case
const createCase = async (req, res) => {
  try {
    const { patient_user_id, symptoms, severity, ai_summary, doctor_user_id, notes } = req.body;

    if (!patient_user_id) {
      return res.status(400).json({ message: "patient_id is required" });
    }

    const patient = await Patients.findByPk(patient_user_id);
    if (!patient) {
      return res.status(404).json({ message: "Patient not found" });
    }

    const newCase = await Case.create({
      patient_user_id,
      doctor_user_id: doctor_user_id || null,
      symptoms,
      severity: severity || null,
      ai_summary: ai_summary || null,
      notes: notes || null,
      status: doctor_user_id ? "assigned" : "open",
    });

    // If doctor assigned, notify them
    if (doctor_user_id) {
      const doctor = await Doctors.findByPk(doctor_user_id);
      if (doctor) {
        await createNotification(
          doctor.user_id,
          "case_assigned",
          "New Case Assigned",
          `A new ${severity || "unclassified"} case has been assigned to you.`,
          newCase.case_id
        );
      }
    }

    return res.status(201).json({
      message: "Case created successfully",
      case: newCase,
    });
  } catch (error) {
    console.error("Error creating case:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

// GET /cases/:case_id
const getCaseById = async (req, res) => {
  try {
    const { case_id } = req.params;

    const caseRecord = await Case.findByPk(case_id, {
      include: [
        {
          model: Patients,
          as: "patient",
          include: [{ model: User, as: "user", attributes: ["first_name", "last_name", "email"] }],
        },
        {
          model: Doctors,
          as: "doctor",
          include: [{ model: User, as: "user", attributes: ["first_name", "last_name", "email"] }],
        },
      ],
    });

    if (!caseRecord) {
      return res.status(404).json({ message: "Case not found" });
    }

    return res.status(200).json({ case: caseRecord });
  } catch (error) {
    console.error("Error fetching case:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

// PUT /cases/:case_id — update case (assign doctor, change status, add notes)
const updateCase = async (req, res) => {
  try {
    const { case_id } = req.params;
    const { doctor_id, status, notes, severity, ai_summary } = req.body;

    const caseRecord = await Case.findByPk(case_id);
    if (!caseRecord) {
      return res.status(404).json({ message: "Case not found" });
    }

    const updateData = { updated_at: new Date() };

    if (doctor_id !== undefined) {
      const doctor = await Doctors.findByPk(doctor_id);
      if (!doctor) {
        return res.status(404).json({ message: "Doctor not found" });
      }
      updateData.doctor_id = doctor_id;
      updateData.status = "assigned";

      // Notify doctor
      await createNotification(
        doctor.user_id,
        "case_assigned",
        "New Case Assigned",
        `A case has been assigned to you.`,
        id
      );
    }

    if (status) {
      updateData.status = status;
      if (status === "closed") {
        updateData.closed_at = new Date();
      }
    }

    if (notes !== undefined) updateData.notes = notes;
    if (severity !== undefined) updateData.severity = severity;
    if (ai_summary !== undefined) updateData.ai_summary = ai_summary;

    await Case.update(updateData, { where: { case_id } });

    const updatedCase = await Case.findByPk(case_id, {
      include: [
        {
          model: Patients,
          as: "patient",
          include: [{ model: User, as: "user", attributes: ["first_name", "last_name"] }],
        },
        {
          model: Doctors,
          as: "doctor",
          include: [{ model: User, as: "user", attributes: ["first_name", "last_name"] }],
        },
      ],
    });

    return res.status(200).json({
      message: "Case updated successfully",
      case: updatedCase,
    });
  } catch (error) {
    console.error("Error updating case:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

// GET /cases — list cases with filters
const listCases = async (req, res) => {
  try {
    const { doctor_id, patient_id, status, severity, created_at, page = 1, limit = 20 } = req.query;

    const where = {};
    if (doctor_id) where.doctor_id = doctor_id;
    if (patient_id) where.patient_id = patient_id;
    if (status) where.status = status;
    if (severity) where.severity = severity;
    if (created_at) where.created_at = created_at;

    const offset = (parseInt(page) - 1) * parseInt(limit);

    const { count, rows: cases } = await Case.findAndCountAll({
      where,
      include: [
        {
          model: Patients,
          as: "patient",
          include: [{ model: User, as: "user", attributes: ["first_name", "last_name"] }],
        },
        {
          model: Doctors,
          as: "doctor",
          include: [{ model: User, as: "user", attributes: ["first_name", "last_name"] }],
        },
      ],
      order: [
        // Sort by severity: emergency > severe > moderate > mild
        [
          require("sequelize").literal(
            `CASE severity 
              WHEN 'emergency' THEN 1 
              WHEN 'severe' THEN 2 
              WHEN 'moderate' THEN 3 
              WHEN 'mild' THEN 4 
              ELSE 5 END`
          ),
          "ASC",
        ],
        ["created_at", "DESC"],
      ],
      limit: parseInt(limit),
      offset,
    });

    return res.status(200).json({
      cases,
      pagination: {
        total: count,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(count / parseInt(limit)),
      },
    });
  } catch (error) {
    console.error("Error listing cases:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

module.exports = {
  createCase,
  getCaseById,
  updateCase,
  listCases,
};
