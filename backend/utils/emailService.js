// utils/emailService.js

const nodemailer = require('nodemailer');
require('dotenv').config();

// Create a Nodemailer transporter using SMTP
const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST,
  port: process.env.EMAIL_PORT,
  secure: true,  // set to true if using port 465 for SSL
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
  // tls: {
  //   rejectUnauthorized: false,  // Disable TLS verification (useful for self-signed certificates)
  // },
  pool: true,  // Enable connection pooling
  socketTimeout: 30000,  // Increase timeout (default: 10000 ms)
  connectionTimeout: 30000,  // Set connection timeout to 30 seconds
});

// Function to send verification email
const sendVerificationEmail = async (userEmail, verificationCode) => {
  const mailOptions = {
    from: process.env.EMAIL_FROM,
    to: userEmail,
    subject: 'Email Verification Code',
    text: `Your verification code is: ${verificationCode}`,
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log('Verification email sent: ', info.response);
  } catch (error) {
    console.error('Error sending email: ', error);
  }
};

// Function to send password reset email
const sendResetPasswordEmail = async (userEmail, resetToken) => {
  const resetLink = `${process.env.FRONTEND_URL}/?token=${resetToken}`;

  const mailOptions = {
    from: process.env.EMAIL_FROM,
    to: userEmail,
    subject: 'Password Reset Request',
    text: `We received a request to reset your password. Click the following link to reset your password: ${resetLink}`,
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log('Reset email sent: ', info.response);
  } catch (error) {
    console.error('Error sending reset email: ', error);
    throw new Error('Failed to send reset password email');
  }
};


module.exports = { sendVerificationEmail, sendResetPasswordEmail };
