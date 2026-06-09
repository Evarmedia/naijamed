const { User, Patients, Doctors } = require("../models/models.js");
const { Op } = require("sequelize");

// GET /patients/:id
const getPatientById = async (req, res) => {
  try {
    const { id } = req.params;

    const patient = await Patients.findOne({
      where: { patient_id: id },
      include: [
        {
          model: User,
          as: "user",
          attributes: {
            exclude: [
              "password",
              "verification_token",
              "verification_token_expiry",
              "reset_password_token",
              "reset_password_token_expiry",
            ],
          },
        },
      ],
    });

    if (!patient) {
      return res.status(404).json({ message: "Patient not found" });
    }

    // Role-based access: only the patient themselves or a doctor can view
    if (
      req.user.role === "patient" &&
      patient.user_id !== req.user.user_id
    ) {
      return res.status(403).json({ message: "Access denied" });
    }

    return res.status(200).json({ patient });
  } catch (error) {
    console.error("Error fetching patient:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

// PUT /patients/:id
const updatePatientProfile = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      first_name,
      last_name,
      email,
      phone_number,
      date_of_birth,
      gender,
      nationality,
      profile_url,
      address,
      state,
      lga,
      blood_group,
      genotype,
      height,
      weight,
      allergies,
      chronic_conditions,
      medications,
      emergency_contact_name,
      emergency_contact_phone,
      emergency_contact_relationship,
      next_of_kin_name,
      next_of_kin_phone,
      next_of_kin_relationship,
    } = req.body;

    const patient = await Patients.findOne({
      where: { patient_id: id },
      include: [{ model: User, as: "user" }],
    });

    if (!patient) {
      return res.status(404).json({ message: "Patient not found" });
    }

    // Only the patient themselves can update their profile
    if (patient.user_id !== req.user.user_id) {
      return res.status(403).json({ message: "Access denied" });
    }

    // Update user fields
    await User.update(
      {
        first_name,
        last_name,
        email,
        phone_number,
        date_of_birth,
        gender,
        nationality,
        profile_url,
        updated_at: new Date(),
      },
      { where: { user_id: patient.user_id } }
    );

    // Update patient fields
    await Patients.update(
      {
        address,
        state,
        lga,
        blood_group,
        genotype,
        height,
        weight,
        allergies,
        chronic_conditions,
        medications,
        emergency_contact_name,
        emergency_contact_phone,
        emergency_contact_relationship,
        next_of_kin_name,
        next_of_kin_phone,
        next_of_kin_relationship,
      },
      { where: { patient_id: id } }
    );

    // Refresh and compute BMI
    const updatedPatient = await Patients.findOne({
      where: { patient_id: id },
      include: [
        {
          model: User,
          as: "user",
          attributes: {
            exclude: [
              "password",
              "verification_token",
              "verification_token_expiry",
              "reset_password_token",
              "reset_password_token_expiry",
            ],
          },
        },
      ],
    });

    if (updatedPatient.weight && updatedPatient.height && updatedPatient.height > 0) {
      const BMI = updatedPatient.weight / (updatedPatient.height * updatedPatient.height);
      updatedPatient.bmi = parseFloat(BMI.toFixed(2));
      await updatedPatient.save();
    }

    return res.status(200).json({
      message: "Patient profile updated successfully",
      patient: updatedPatient,
    });
  } catch (error) {
    console.error("Error updating patient profile:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

// POST /patients/:id/photo
const uploadPatientPhoto = async (req, res) => {
  try {
    const { id } = req.params;

    const patient = await Patients.findOne({
      where: { patient_id: id },
    });

    if (!patient) {
      return res.status(404).json({ message: "Patient not found" });
    }

    if (patient.user_id !== req.user.user_id) {
      return res.status(403).json({ message: "Access denied" });
    }

    if (!req.file) {
      return res.status(400).json({ message: "No photo file provided" });
    }

    const photoUrl = `/uploads/${req.file.filename}`;
    await User.update(
      { profile_url: photoUrl, updated_at: new Date() },
      { where: { user_id: patient.user_id } }
    );

    return res.status(200).json({
      message: "Photo uploaded successfully",
      profile_url: photoUrl,
    });
  } catch (error) {
    console.error("Error uploading patient photo:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

// GET /doctors/:id
const getDoctorById = async (req, res) => {
  try {
    const { id } = req.params;

    const doctor = await Doctors.findOne({
      where: { doctor_id: id },
      include: [
        {
          model: User,
          as: "user",
          attributes: {
            exclude: [
              "password",
              "verification_token",
              "verification_token_expiry",
              "reset_password_token",
              "reset_password_token_expiry",
            ],
          },
        },
      ],
    });

    if (!doctor) {
      return res.status(404).json({ message: "Doctor not found" });
    }

    return res.status(200).json({ doctor });
  } catch (error) {
    console.error("Error fetching doctor:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

// PUT /doctors/:id
const updateDoctorProfile = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      first_name,
      last_name,
      email,
      phone_number,
      date_of_birth,
      gender,
      nationality,
      profile_url,
      age,
      specialization,
      medical_rank,
      experience_years,
      license_number,
      license_expiry_date,
      hospital_affiliation,
      address,
      state,
    } = req.body;

    const doctor = await Doctors.findOne({
      where: { doctor_id: id },
      include: [{ model: User, as: "user" }],
    });

    if (!doctor) {
      return res.status(404).json({ message: "Doctor not found" });
    }

    if (doctor.user_id !== req.user.user_id) {
      return res.status(403).json({ message: "Access denied" });
    }

    // Update user fields
    await User.update(
      {
        first_name,
        last_name,
        email,
        phone_number,
        date_of_birth,
        gender,
        nationality,
        profile_url,
        updated_at: new Date(),
      },
      { where: { user_id: doctor.user_id } }
    );

    // Update doctor fields
    await Doctors.update(
      {
        age,
        specialization,
        medical_rank,
        experience_years,
        license_number,
        license_expiry_date,
        hospital_affiliation,
        address,
        state,
      },
      { where: { doctor_id: id } }
    );

    const updatedDoctor = await Doctors.findOne({
      where: { doctor_id: id },
      include: [
        {
          model: User,
          as: "user",
          attributes: {
            exclude: [
              "password",
              "verification_token",
              "verification_token_expiry",
              "reset_password_token",
              "reset_password_token_expiry",
            ],
          },
        },
      ],
    });

    return res.status(200).json({
      message: "Doctor profile updated successfully",
      doctor: updatedDoctor,
    });
  } catch (error) {
    console.error("Error updating doctor profile:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

// POST /doctors/:id/photo
const uploadDoctorPhoto = async (req, res) => {
  try {
    const { id } = req.params;

    const doctor = await Doctors.findOne({
      where: { doctor_id: id },
    });

    if (!doctor) {
      return res.status(404).json({ message: "Doctor not found" });
    }

    if (doctor.user_id !== req.user.user_id) {
      return res.status(403).json({ message: "Access denied" });
    }

    if (!req.file) {
      return res.status(400).json({ message: "No photo file provided" });
    }

    const photoUrl = `/uploads/${req.file.filename}`;
    await User.update(
      { profile_url: photoUrl, updated_at: new Date() },
      { where: { user_id: doctor.user_id } }
    );

    return res.status(200).json({
      message: "Photo uploaded successfully",
      profile_url: photoUrl,
    });
  } catch (error) {
    console.error("Error uploading doctor photo:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

// GET /patients/:id/history
const getPatientHistory = async (req, res) => {
  try {
    const { id } = req.params;
    const { startDate, endDate, severity } = req.query;

    const patient = await Patients.findOne({ where: { patient_id: id } });
    if (!patient) {
      return res.status(404).json({ message: "Patient not found" });
    }

    // Access check
    if (req.user.role === "patient" && patient.user_id !== req.user.user_id) {
      return res.status(403).json({ message: "Access denied" });
    }

    const { Case } = require("../models/models");
    const caseWhere = { patient_id: id };

    if (startDate && endDate) {
      caseWhere.created_at = { [Op.between]: [new Date(startDate), new Date(endDate)] };
    }
    if (severity) {
      caseWhere.triage_classification = severity;
    }

    const cases = await Case.findAll({
      where: caseWhere,
      include: [
        { model: Doctors, as: "doctor", include: [{ model: User, as: "user", attributes: ["first_name", "last_name"] }] },
        { model: require("../models/models").Prescription, as: "prescriptions" },
      ],
      order: [["created_at", "DESC"]],
    });

    return res.status(200).json({ patient_id: id, history: cases });
  } catch (error) {
    console.error("Error fetching patient history:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

// GET /doctors/:id/caselog
const getDoctorCaseLog = async (req, res) => {
  try {
    const { id } = req.params;
    const { startDate, endDate, severity } = req.query;

    const doctor = await Doctors.findOne({ where: { doctor_id: id } });
    if (!doctor) {
      return res.status(404).json({ message: "Doctor not found" });
    }

    if (req.user.role === "doctor" && doctor.user_id !== req.user.user_id) {
      return res.status(403).json({ message: "Access denied" });
    }

    const { Case } = require("../models/models");
    const caseWhere = { doctor_id: id };

    if (startDate && endDate) {
      caseWhere.created_at = { [Op.between]: [new Date(startDate), new Date(endDate)] };
    }
    if (severity) {
      caseWhere.triage_classification = severity;
    }

    const cases = await Case.findAll({
      where: caseWhere,
      include: [
        { model: Patients, as: "patient", include: [{ model: User, as: "user", attributes: ["first_name", "last_name"] }] },
        { model: require("../models/models").Prescription, as: "prescriptions" },
      ],
      order: [["created_at", "DESC"]],
    });

    return res.status(200).json({ doctor_id: id, caselog: cases });
  } catch (error) {
    console.error("Error fetching doctor caselog:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

module.exports = {
  getPatientById,
  updatePatientProfile,
  uploadPatientPhoto,
  getDoctorById,
  updateDoctorProfile,
  uploadDoctorPhoto,
  getPatientHistory,
  getDoctorCaseLog,
};
