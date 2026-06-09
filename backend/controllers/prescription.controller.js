const { Prescription, Case, Doctors } = require("../models/models");

// POST /cases/:caseId/prescriptions — create a prescription
const createPrescription = async (req, res) => {
  try {
    const { caseId } = req.params;
    const { drug_name, dosage, frequency, duration, instructions } = req.body;

    if (!drug_name || !dosage || !frequency || !duration) {
      return res.status(400).json({
        message: "drug_name, dosage, frequency, and duration are required",
      });
    }

    // Verify case exists
    const caseRecord = await Case.findByPk(caseId);
    if (!caseRecord) {
      return res.status(404).json({ message: "Case not found" });
    }

    // Verify the requesting user is a doctor
    if (req.user.role !== "doctor") {
      return res.status(403).json({ message: "Only doctors can create prescriptions" });
    }

    // Get doctor record
    const doctor = await Doctors.findOne({ where: { user_id: req.user.user_id } });
    if (!doctor) {
      return res.status(404).json({ message: "Doctor profile not found" });
    }

    const prescription = await Prescription.create({
      case_id: caseId,
      doctor_id: doctor.doctor_id,
      drug_name,
      dosage,
      frequency,
      duration,
      instructions: instructions || null,
    });

    return res.status(201).json({
      message: "Prescription created successfully",
      prescription,
    });
  } catch (error) {
    console.error("Error creating prescription:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

// GET /cases/:caseId/prescriptions
const getPrescriptions = async (req, res) => {
  try {
    const { caseId } = req.params;

    const caseRecord = await Case.findByPk(caseId);
    if (!caseRecord) {
      return res.status(404).json({ message: "Case not found" });
    }

    const prescriptions = await Prescription.findAll({
      where: { case_id: caseId },
      include: [
        {
          model: Doctors,
          as: "doctor",
          include: [
            {
              model: require("../models/models").User,
              as: "user",
              attributes: ["first_name", "last_name"],
            },
          ],
        },
      ],
      order: [["created_at", "DESC"]],
    });

    return res.status(200).json({
      case_id: caseId,
      prescriptions,
    });
  } catch (error) {
    console.error("Error fetching prescriptions:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

module.exports = {
  createPrescription,
  getPrescriptions,
};
