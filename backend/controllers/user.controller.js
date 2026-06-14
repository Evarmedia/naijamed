const { User, Patients, Doctors, Case, Prescription, Drug } = require("../models/models.js");
const { Op } = require("sequelize");

const USER_SAFE_ATTRIBUTES = {
  exclude: [
    "password",
    "verification_token",
    "verification_token_expiry",
    "reset_password_token",
    "reset_password_token_expiry",
  ],
};
// [USER]
// GET /profile
const getUserProfile = async (req, res) => {
  try {
    const { user_id, role } = req.user;

    const normalizedRole = role?.toLowerCase();

    let ProfileModel;
    let profileKey;
    let notFoundMessage;

    if (normalizedRole === "patient") {
      ProfileModel = Patients;
      profileKey = "patient";
      notFoundMessage = "Patient not found";
    } else if (normalizedRole === "doctor") {
      ProfileModel = Doctors;
      profileKey = "doctor";
      notFoundMessage = "Doctor not found";
    } else {
      return res.status(403).json({
        message: "Access denied. Invalid profile role.",
      });
    }

    const profile = await ProfileModel.findOne({
      where: { user_id },
      include: [
        {
          model: User,
          as: "user",
          attributes: USER_SAFE_ATTRIBUTES,
        },
      ],
    });

    if (!profile) {
      return res.status(404).json({ message: notFoundMessage });
    }

    return res.status(200).json({
      [profileKey]: profile,
    });
  } catch (error) {
    console.error("Error fetching profile:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

// GET /api/users/:user_id
const getUserById = async (req, res) => {
  try {
    const { user_id } = req.params;

    if (!user_id) {
      return res.status(400).json({
        message: "User ID is required",
      });
    }

    const user = await User.findOne({
      where: { user_id },
      attributes: USER_SAFE_ATTRIBUTES,
    });

    if (!user) {
      return res.status(404).json({
        message: "User not found",
      });
    }

    return res.status(200).json({
      message: "User fetched successfully",
      user,
    });
  } catch (error) {
    console.error("Error fetching user by ID:", error);
    return res.status(500).json({
      message: "Internal server error",
    });
  }
};

// PUT /patients/profile
const updatePatientProfile = async (req, res) => {
  try {
    const { user_id } = req.user;

    const {
      first_name,
      last_name,
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
      where: { user_id },
      include: [{ model: User, as: "user" }],
    });

    if (!patient) {
      return res.status(404).json({ message: "Patient not found" });
    }

    // Only the patient themselves can update their profile
    if (patient.user_id !== req.user.user_id) {
      return res.status(403).json({ message: "Access denied" });
    }

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
      { where: { user_id: patient.user_id } }
    );

    const updatedPatient = await Patients.findOne({
      where: { user_id: patient.user_id },
      include: [
        {
          model: User,
          as: "user",
          attributes: USER_SAFE_ATTRIBUTES,
        },
      ],
    });

    if (
      updatedPatient.weight &&
      updatedPatient.height &&
      Number(updatedPatient.height) > 0
    ) {
      const BMI =
        Number(updatedPatient.weight) /
        (Number(updatedPatient.height) * Number(updatedPatient.height));

      updatedPatient.bmi = parseFloat(BMI.toFixed(2));
      await updatedPatient.save();
    }

    // Mark profile as completed
    await User.update(
      { profile_completed: true },
      { where: { user_id: patient.user_id } }
    );

    return res.status(200).json({
      message: "Patient profile updated successfully",
      patient: updatedPatient,
    });
  } catch (error) {
    console.error("Error updating patient profile:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

// POST /patients/photo
const uploadPatientPhoto = async (req, res) => {
  try {
    const { user_id } = req.user;

    const patient = await Patients.findOne({
      where: { user_id },
    });

    if (!patient) {
      return res.status(404).json({ message: "Patient not found" });
    }

    if (!req.file) {
      return res.status(400).json({ message: "No photo file provided" });
    }

    const photoUrl = `/uploads/${req.file.filename}`;

    await User.update(
      {
        profile_url: photoUrl,
        updated_at: new Date(),
      },
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

// PUT /doctors/profile
const updateDoctorProfile = async (req, res) => {
  try {
    const { user_id } = req.user;

    const {
      first_name,
      last_name,
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
      where: { user_id },
      include: [{ model: User, as: "user" }],
    });

    if (!doctor) {
      return res.status(404).json({ message: "Doctor not found" });
    }

    if (doctor.user_id !== req.user.user_id) {
      return res.status(403).json({ message: "Access denied" });
    }

    await User.update(
      {
        first_name,
        last_name,
        phone_number,
        date_of_birth,
        gender,
        nationality,
        profile_url,
        updated_at: new Date(),
      },
      { where: { user_id: doctor.user_id } }
    );

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
      { where: { user_id: doctor.user_id } }
    );

    const updatedDoctor = await Doctors.findOne({
      where: { user_id: doctor.user_id },
      include: [
        {
          model: User,
          as: "user",
          attributes: USER_SAFE_ATTRIBUTES,
        },
      ],
    });

    // Mark profile as completed
    await User.update(
      { profile_completed: true },
      { where: { user_id: doctor.user_id } }
    );

    return res.status(200).json({
      message: "Doctor profile updated successfully",
      doctor: updatedDoctor,
    });
  } catch (error) {
    console.error("Error updating doctor profile:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

// POST /doctors/photo
const uploadDoctorPhoto = async (req, res) => {
  try {
    const { user_id } = req.user;

    const doctor = await Doctors.findOne({
      where: { user_id },
    });

    if (!doctor) {
      return res.status(404).json({ message: "Doctor not found" });
    }

    if (!req.file) {
      return res.status(400).json({ message: "No photo file provided" });
    }

    const photoUrl = `/uploads/${req.file.filename}`;

    await User.update(
      {
        profile_url: photoUrl,
        updated_at: new Date(),
      },
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

// GET /patients/history
const getPatientHistory = async (req, res) => {
  try {
    const { user_id } = req.user;
    const { severity, start_date, end_date } = req.query;

    const patient = await Patients.findOne({
      where: { user_id },
    });

    if (!patient) {
      return res.status(404).json({ message: "Patient not found" });
    }

    if (req.user.role === "patient" && patient.user_id !== req.user.user_id) {
      return res.status(403).json({ message: "Access denied" });
    }

    const caseWhere = {
      patient_id: patient.patient_id,
    };

    if (start_date && end_date) {
      caseWhere.created_at = {
        [Op.between]: [start_date, end_date],
      };
    }

    if (severity) {
      caseWhere.severity = severity;
    }

    const cases = await Case.findAll({
      where: caseWhere,
      include: [
        {
          model: Doctors,
          as: "doctor",
          include: [
            {
              model: User,
              as: "user",
              attributes: ["user_id", "first_name", "last_name"],
            },
          ],
        },
        {
          model: Prescription,
          as: "prescriptions",
          include: [
            {
              model: Drug,
              as: "drugs",
            },
          ],
        },
      ],
      order: [["created_at", "DESC"]],
    });

    return res.status(200).json({
      user_id: patient.user_id,
      patient_id: patient.patient_id,
      history: cases,
    });
  } catch (error) {
    console.error("Error fetching patient history:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

// GET /doctors/caselog
const getDoctorCaseLog = async (req, res) => {
  try {
    const { user_id } = req.user;
    const { start_date, end_date, severity } = req.query;

    const doctor = await Doctors.findOne({
      where: { user_id },
    });

    if (!doctor) {
      return res.status(404).json({ message: "Doctor not found" });
    }

    if (req.user.role !== "doctor") {
      return res.status(403).json({ message: "Access denied" });
    }

    const caseWhere = {
      doctor_id: doctor.doctor_id,
    };

    if (start_date && end_date) {
      caseWhere.created_at = {
        [Op.between]: [start_date, end_date],
      };
    }

    if (severity) {
      caseWhere.severity = severity;
    }

    const cases = await Case.findAll({
      where: caseWhere,
      include: [
        {
          model: Patients,
          as: "patient",
          include: [
            {
              model: User,
              as: "user",
              // attributes: ["user_id", "first_name", "last_name"],
            },
          ],
        },
        {
          model: Prescription,
          as: "prescriptions",
          include: [
            {
              model: Drug,
              as: "drugs",
            },
          ],
        },
      ],
      order: [["created_at", "DESC"]],
    });

    return res.status(200).json({
      user_id: doctor.user_id,
      doctor_id: doctor.doctor_id,
      caselog: cases,
    });
  } catch (error) {
    console.error("Error fetching doctor caselog:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

// GET /doctors
const getAllDoctors = async (req, res) => {
  try {
    const doctors = await Doctors.findAll({
      include: [
        {
          model: User,
          as: "user",
          attributes: USER_SAFE_ATTRIBUTES,
        },
      ],
    });
    return res.status(200).json({ doctors });
  } catch (error) {
    console.error("Error fetching all doctors:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

module.exports = {
  getUserProfile,
  updatePatientProfile,
  uploadPatientPhoto,
  updateDoctorProfile,
  uploadDoctorPhoto,
  getPatientHistory,
  getDoctorCaseLog,
  getAllDoctors,
  getUserById,
};