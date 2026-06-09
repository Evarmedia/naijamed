const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { User, Patients, Doctors } = require("../models/models.js");
const crypto = require("crypto");
const {
  sendVerificationEmail,
  sendResetPasswordEmail,
} = require("../utils/emailService.js");
const { Op } = require("sequelize");
const config = require("../config/jwt");

// Register a new user
const register = async (req, res) => {
  try {
    const { first_name, last_name, email, phone_number, password, confirm_password, role } =
      req.body;

    if (!first_name || !last_name || !email || !password || !role) {
      return res.status(400).json({ message: "All required fields must be provided" });
    }

    if (!["patient", "doctor"].includes(role)) {
      return res.status(400).json({ message: "Role must be 'patient' or 'doctor'" });
    }

    // Check if the user already exists
    const existingUserByEmail = await User.findOne({ where: { email } });
    if (existingUserByEmail) {
      return res.status(400).json({ message: "Email is already registered" });
    }

    if (phone_number) {
      const existingUserByPhone = await User.findOne({ where: { phone_number } });
      if (existingUserByPhone) {
        return res.status(400).json({ message: "Phone number is already registered" });
      }
    }

    if (password !== confirm_password) {
      return res.status(400).json({ message: "Passwords do not match" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    // Generate OTP for verification
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const otpExpiry = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    const newUser = await User.create({
      first_name,
      last_name,
      email,
      phone_number: phone_number || null,
      password: hashedPassword,
      role,
      verification_token: otp,
      verification_token_expiry: otpExpiry,
    });

    if (newUser.role === "patient") {
      await Patients.create({ user_id: newUser.user_id });
    }

    if (newUser.role === "doctor") {
      await Doctors.create({ user_id: newUser.user_id });
    }

    // Send verification email
    try {
      await sendVerificationEmail(newUser.email, otp);
    } catch (emailErr) {
      console.error("Failed to send verification email:", emailErr);
    }

    return res.status(201).json({
      message: "User registered successfully. Please verify your email with the OTP sent.",
      user: {
        user_id: newUser.user_id,
        first_name: newUser.first_name,
        last_name: newUser.last_name,
        email: newUser.email,
        phone_number: newUser.phone_number,
        role: newUser.role,
      },
    });
  } catch (error) {
    console.error("Registration error:", error);
    return res.status(500).json({ message: "Server error" });
  }
};

// Login — supports email or phone_number
const login = async (req, res) => {
  const { email, password } = req.body;

  try {
    if (!password || (!email)) {
      return res
        .status(400)
        .json({ message: "Email and password are required" });
    }

    // Find user by email or phone
   
    const user = await User.findOne({ where: { email } });

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    if (!user.is_active) {
      return res.status(403).json({ message: "Account is deactivated" });
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    // Update last login
    await user.update({ last_login: new Date() });

    const token = jwt.sign(
      {
        user_id: user.user_id,
        email: user.email,
        phone_number: user.phone_number,
        role: user.role,
      },
      config.jwtSecret,
      { expiresIn: config.jwtExpiration }
    );

    return res.status(200).json({
      message: "Logged in successfully",
      token,
      user: {
        user_id: user.user_id,
        first_name: user.first_name,
        last_name: user.last_name,
        email: user.email,
        role: user.role,
        is_verified: user.is_verified,
      },
    });
  } catch (error) {
    console.error("Login error:", error);
    return res.status(500).json({ message: "Server error" });
  }
};

// Verify OTP (DB-based, replaces Redis)
const verifyOtp = async (req, res) => {
  const { email, otp } = req.body;

  try {
    if (!email || !otp) {
      return res.status(400).json({ message: "Email and OTP are required" });
    }

    const user = await User.findOne({ where: { email } });
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    if (user.is_verified) {
      return res.status(400).json({ message: "User is already verified" });
    }

    if (!user.verification_token || user.verification_token !== otp) {
      return res.status(400).json({ message: "Invalid OTP" });
    }

    if (new Date() > new Date(user.verification_token_expiry)) {
      return res.status(400).json({ message: "OTP has expired" });
    }

    await user.update({
      is_verified: true,
      verification_token: null,
      verification_token_expiry: null,
    });

    return res.status(200).json({ message: "Email verified successfully" });
  } catch (error) {
    console.error("OTP verification error:", error);
    return res.status(500).json({ message: "Server error" });
  }
};

// Forgot Password
const forgotPassword = async (req, res) => {
  const { email } = req.body;

  try {
    if (!email) {
      return res.status(400).json({ message: "Email is required" });
    }

    const user = await User.findOne({ where: { email } });
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const resetToken = crypto.randomBytes(20).toString("hex");
    const resetTokenExpiration = new Date(Date.now() + 3600000); // 1 hour

    await user.update({
      reset_password_token: resetToken,
      reset_password_token_expiry: resetTokenExpiration,
    });

    await sendResetPasswordEmail(user.email, resetToken);

    return res.status(200).json({
      message: "Password reset email sent. Please check your inbox.",
    });
  } catch (error) {
    console.error("Forgot password error:", error);
    return res.status(500).json({ message: "Server error" });
  }
};

// Reset Password
const resetPassword = async (req, res) => {
  const { resetToken, newPassword } = req.body;

  try {
    if (!resetToken || !newPassword) {
      return res.status(400).json({ message: "Reset token and new password are required" });
    }

    const user = await User.findOne({
      where: {
        reset_password_token: resetToken,
        reset_password_token_expiry: {
          [Op.gt]: new Date(),
        },
      },
    });

    if (!user) {
      return res.status(400).json({ message: "Invalid or expired token" });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);

    await user.update({
      password: hashedPassword,
      reset_password_token: null,
      reset_password_token_expiry: null,
    });

    return res
      .status(200)
      .json({ message: "Password has been successfully updated." });
  } catch (error) {
    console.error("Reset password error:", error);
    return res.status(500).json({ message: "Server error" });
  }
};

module.exports = {
  register,
  login,
  verifyOtp,
  forgotPassword,
  resetPassword,
};
