const { User, Patients, Doctors } = require("../models/models.js");
const crypto = require("crypto");

const { Op } = require("sequelize");

// PUT /api/users/patient/profile
const updatePatientProfile = async (req, res) => {
  const { user_id } = req.user;
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
    blood_group,
    height,
    weight,
  } = req.body;

  try {
    // Find the patient by userId
    const patient = await Patients.findOne({
      where: { user_id },
      include: [{ model: User, as: "user" }],
    });

    if (!patient) {
      return res.status(404).json({ message: "Patient not found" });
    }

    // Update user profile
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
      },
      { where: { user_id } }
    );

    // Update patient details
    await Patients.update(
      {
        address,
        blood_group,
        height,
        weight,
      },
      { where: { user_id } }
    );

    const updatedPatient = await Patients.findOne({
      where: { user_id },
      include: [{ model: User, as: "user" }],
    });

    return res.status(200).json({
      message: "Patient Profile updated successfully",
      patient: {
        first_name: updatedPatient.user.first_name,
        last_name: updatedPatient.user.last_name,
        email: updatedPatient.user.email,
        phone_number: updatedPatient.user.phone_number,
        date_of_birth: updatedPatient.user.date_of_birth,
        gender: updatedPatient.user.gender,
        nationality: updatedPatient.user.nationality,
        profile_url: updatedPatient.user.profile_url,
        address: updatedPatient.address,
        blood_group: updatedPatient.blood_group,
        height: updatedPatient.height,
        weight: updatedPatient.weight,
      },
    });
  } catch (error) {
    console.error("Error updating patient profile:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

// PUT /api/users/doctor/profile
const updateDoctorProfile = async (req, res) => {
  const { user_id } = req.user;
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
  } = req.body;

  try {
    // Find the patient by userId
    const doctor = await Doctors.findOne({
      where: { user_id },
      include: [{ model: User, as: "user" }],
    });

    if (!doctor) {
      return res.status(404).json({ message: "Doctor not found" });
    }

    // Update user profile
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
      },
      { where: { user_id } }
    );

    // Update doctor details
    await Doctors.update(
      {
        age,
        specialization,
        medical_rank,
        experience_years,
        license_number,
      },
      { where: { user_id } }
    );

    const updatedDoc = await Doctors.findOne({
      where: { user_id },
      include: [{ model: User, as: "user" }],
    });

    return res.status(200).json({
      message: "Doctor Profile updated successfully",
      patient: {
        first_name: updatedDoc.user.first_name,
        last_name: updatedDoc.user.last_name,
        email: updatedDoc.user.email,
        phone_number: updatedDoc.user.phone_number,
        date_of_birth: updatedDoc.user.date_of_birth,
        gender: updatedDoc.user.gender,
        nationality: updatedDoc.user.nationality,
        profile_url: updatedDoc.user.profile_url,
        address: updatedDoc.age,
        blood_group: updatedDoc.specialization,
        height: updatedDoc.medical_rank,
        weight: updatedDoc.experience_years,
        weight: updatedDoc.license_number,
      },
    });
  } catch (error) {
    console.error("Error updating doctor profile:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

const getUserProfile = async (req, res) => {
  const { userId } = req.user;

  try {
    // Find the user by userId
    const user = await User.findOne({
      where: { id: userId },
      attributes: ["id", "full_name", "email", "phone_number", "role"],
    });

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Find the profile based on the user's role
    let profile;
    if (user.role === "patient") {
      profile = await Patients.findOne({ where: { userId } });
    } else if (user.role === "doctor") {
      profile = await Doctors.findOne({ where: { userId } });
    }

    return res.status(200).json({ user, profile });
  } catch (error) {
    console.error("Error fetching user profile:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};
const getAllUsers = async (req, res) => {
  try {
    const users = await User.findAll({
      attributes: ["id", "full_name", "email", "phone_number", "role"],
    });

    return res.status(200).json(users);
  } catch (error) {
    console.error("Error fetching all users:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};
const deleteUser = async (req, res) => {
  const { userId } = req.params;

  try {
    // Find the user by userId
    const user = await User.findOne({ where: { id: userId } });

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Delete the user
    await User.destroy({ where: { id: userId } });

    return res.status(200).json({ message: "User deleted successfully" });
  } catch (error) {
    console.error("Error deleting user:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};
const searchUsers = async (req, res) => {
  const { query } = req.query;

  try {
    const users = await User.findAll({
      where: {
        [Op.or]: [
          { full_name: { [Op.iLike]: `%${query}%` } },
          { email: { [Op.iLike]: `%${query}%` } },
          { phone_number: { [Op.iLike]: `%${query}%` } },
        ],
      },
      attributes: ["id", "full_name", "email", "phone_number", "role"],
    });

    return res.status(200).json(users);
  } catch (error) {
    console.error("Error searching users:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};
module.exports = {
  updatePatientProfile,
  updateDoctorProfile,
  getUserProfile,
  getAllUsers,
  deleteUser,
  searchUsers,
};
