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
const redis = require("../utils/redis.js");

// Register a new user
const register = async (req, res) => {
  try {
    const { full_name, email, phone_number, password, confirm_password, role } =
      req.body;

    // Check if the user already exists
    const existingUserByEmail = await User.findOne({ where: { email } });
    if (existingUserByEmail) {
      return res.status(400).json({ message: "Email is already registered" });
    }

    const existingUserByPhone = await User.findOne({ where: { phone_number } });
    if (existingUserByPhone) {
      return res
        .status(400)
        .json({ message: "Phone number is already registered" });
    }

    if (password !== confirm_password) {
      return res.status(400).json({ message: "Passwords do not match" });
    }
    const hashedPassword = await bcrypt.hash(password, 10);
    // Create the user
    const newUser = await User.create({
      full_name,
      email,
      phone_number,
      password: hashedPassword,
      role,
    });

    if (newUser.role === "patient") {
      await Patients.create({
        user_id: newUser.user_id,
      });
    }

    if (newUser.role === "doctor") {
      await Doctors.create({
        user_id: newUser.user_id,
      });
    }

    return res.status(201).json({
      message:
        "User registered successfully, check your email for verification",
      user: {
        user_id: newUser.user_id,
        full_name: newUser.full_name,
        email: newUser.email,
        phone_number: newUser.phone_number,
        role: newUser.role,
      },
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Server error" });
  }
};
// Add login logic here using config from config/jwt
const login = async (req, res) => {
  const { phone_number, password } = req.body;

  try {
    // Check if the user exists
    const user = await User.findOne({ where: { phone_number } });
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Check if the password is correct
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    // Create a JWT token
    const token = jwt.sign(
      { user_id: user.user_id, email: user.email, phone_number: user.phone_number, role: user.role },
      config.jwtSecret,
      {
        expiresIn: config.jwtExpiration,
      }
    );

    return res.status(200).json({
      message: "Logged in successfully",
      token,
      user: {
        user_id: user.user_id,
        full_name: user.full_name,
        email: user.email,
        phone_number: user.phone_number,
        role: user.role,
      },
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Server error" });
  }
};

// verify-email
// Controller to verify the email code with Redis
const verifyEmail = async (req, res) => {
  const { email, verificationCode } = req.body;

  // Get the verification code from Redis
  const storedCode = await redis.get(`verification_code_${email}`);
  if (!storedCode) {
    return res
      .status(400)
      .json({ message: "Verification code has expired or does not exist" });
  }

  // Compare the stored code with the submitted one
  if (storedCode === verificationCode) {
    // Update the user's status to 'verified'
    const user = await User.findOne({ where: { email } });
    if (user) {
      await user.update({
        status: "verified",
      });

      // delete the code from Redis once verified
      await redis.del(`verification_code_${email}`);

      return res.status(200).json({ message: "Email verified successfully" });
    } else {
      return res.status(404).json({ message: "User not found" });
    }
  } else {
    return res.status(400).json({ message: "Invalid verification code" });
  }
};

// Forgot Password Endpoint
const forgotPassword = async (req, res) => {
  const { email } = req.body;

  try {
    // Check if user exists
    const user = await User.findOne({ where: { email } });
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Generate a random reset token (for example, using crypto)
    const resetToken = crypto.randomBytes(20).toString("hex");
    const resetTokenExpiration = new Date(Date.now() + 3600000); // Token expires in 1 hour

    // Store reset token and expiration in the database
    user.reset_token = resetToken;
    user.reset_token_expiration = resetTokenExpiration;
    await user.save();

    // Send the reset token to the user's email
    await sendResetPasswordEmail(user.email, resetToken);

    return res.status(200).json({
      message: "Password reset email sent. Please check your inbox.",
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Server error" });
  }
};

// Reset Password Endpoint
const resetPassword = async (req, res) => {
  const { resetToken, newPassword } = req.body;

  try {
    // Find the user by the reset token
    const user = await User.findOne({
      where: {
        reset_token: resetToken,
        reset_token_expiration: {
          [Op.gt]: new Date(), // Ensure the token has not expired
        },
      },
    });

    if (!user) {
      return res.status(400).json({ message: "Invalid or expired token" });
    }

    // Hash the new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // Update the user's password and reset token fields
    user.password = hashedPassword;
    user.reset_token = null;
    user.reset_token_expiration = null;
    await user.save();

    return res
      .status(200)
      .json({ message: "Password has been successfully updated." });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Server error" });
  }
};

module.exports = {
  register,
  login,
  verifyEmail,
  forgotPassword,
  resetPassword,
};
