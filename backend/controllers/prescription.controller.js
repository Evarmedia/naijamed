const { Prescription, Drug, Case, Doctors } = require("../models/models");

// POST /cases/:case_id/prescriptions — create a prescription
const createPrescription = async (req, res) => {
  try {
    const { case_id } = req.params;
    const { drugs, drug_name, dosage, frequency, duration, instructions } = req.body;

    // Verify case exists
    const caseRecord = await Case.findByPk(case_id);
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

    // Prepare list of drugs to create
    let drugsToCreate = [];
    if (drugs && Array.isArray(drugs)) {
      if (drugs.length === 0) {
        return res.status(400).json({ message: "At least one drug must be specified" });
      }
      for (const d of drugs) {
        if (!d.drug_name || !d.dosage || !d.frequency || !d.duration) {
          return res.status(400).json({
            message: "Each drug must have drug_name, dosage, frequency, and duration",
          });
        }
        drugsToCreate.push({
          drug_name: d.drug_name,
          dosage: d.dosage,
          frequency: d.frequency,
          duration: d.duration,
          instructions: d.instructions || null,
        });
      }
    } else {
      // Fallback to single drug format
      if (!drug_name || !dosage || !frequency || !duration) {
        return res.status(400).json({
          message: "drug_name, dosage, frequency, and duration are required",
        });
      }
      drugsToCreate.push({
        drug_name,
        dosage,
        frequency,
        duration,
        instructions: instructions || null,
      });
    }

    // Create prescription group
    const prescription = await Prescription.create({
      case_id: case_id,
      doctor_id: doctor.doctor_id,
    });

    // Create associated drugs
    await Promise.all(
      drugsToCreate.map((d) =>
        Drug.create({
          prescription_id: prescription.prescription_id,
          ...d,
        })
      )
    );

    // Retrieve the fully created prescription with its drugs and doctor info
    const result = await Prescription.findOne({
      where: { prescription_id: prescription.prescription_id },
      include: [
        {
          model: Drug,
          as: "drugs",
        },
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
    });

    return res.status(201).json({
      message: "Prescription created successfully",
      prescription: result,
    });
  } catch (error) {
    console.error("Error creating prescription:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

// GET /cases/:case_id/prescriptions
const getPrescriptions = async (req, res) => {
  try {
    const { case_id } = req.params;

    const caseRecord = await Case.findByPk(case_id);
    if (!caseRecord) {
      return res.status(404).json({ message: "Case not found" });
    }

    const prescriptions = await Prescription.findAll({
      where: { case_id },
      include: [
        {
          model: Drug,
          as: "drugs",
        },
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
      case_id: case_id,
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
