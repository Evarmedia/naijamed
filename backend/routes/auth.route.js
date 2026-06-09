const express = require('express');
const { register, login, verifyOtp, forgotPassword, resetPassword } = require('../controllers/auth.controller');
const { authLimiter } = require('../middleware/rateLimiter');
const { auditLogger } = require('../middleware/auditLogger');

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Auth
 *   description: User authentication and registration
 */

/**
 * @swagger
 * /api/auth/signup:
 *   post:
 *     summary: Register a new user
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - first_name
 *               - last_name
 *               - email
 *               - password
 *               - confirm_password
 *               - role
 *             properties:
 *               first_name:
 *                 type: string
 *                 example: John
 *               last_name:
 *                 type: string
 *                 example: Doe
 *               email:
 *                 type: string
 *                 example: johndoe@example.com
 *               phone_number:
 *                 type: string
 *                 example: "+2348000000000"
 *               password:
 *                 type: string
 *                 example: "SecurePass123"
 *               confirm_password:
 *                 type: string
 *                 example: "SecurePass123"
 *               role:
 *                 type: string
 *                 enum: [patient, doctor]
 *                 example: patient
 *     responses:
 *       201:
 *         description: User registered successfully
 *       400:
 *         description: Bad request
 */
router.post('/signup', authLimiter, auditLogger('REGISTER', 'user'), register);

/**
 * @swagger
 * /api/auth/login:
 *   post:
 *     summary: User login
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - password
 *             properties:
 *               email:
 *                 type: string
 *                 example: johndoe@example.com
 *               password:
 *                 type: string
 *                 example: "SecurePass123"
 *     responses:
 *       200:
 *         description: User logged in successfully
 *       400:
 *         description: Bad request
 *       401:
 *         description: Invalid credentials
 *       403:
 *         description: Account deactivated
 */
router.post('/login', authLimiter, auditLogger('LOGIN', 'user'), login);

/**
 * @swagger
 * /api/auth/verify-otp:
 *   post:
 *     summary: Verify user email with OTP
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - otp
 *             properties:
 *               email:
 *                 type: string
 *                 example: johndoe@example.com
 *               otp:
 *                 type: string
 *                 example: "123456"
 *     responses:
 *       200:
 *         description: Email verified successfully
 *       400:
 *         description: Invalid OTP or already verified
 *       404:
 *         description: User not found
 */
router.post('/verify-otp', authLimiter, auditLogger('VERIFY_OTP', 'user'), verifyOtp);

/**
 * @swagger
 * /api/auth/forgot-password:
 *   post:
 *     summary: Request password reset email
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *             properties:
 *               email:
 *                 type: string
 *                 example: johndoe@example.com
 *     responses:
 *       200:
 *         description: Password reset link sent successfully
 *       400:
 *         description: Bad request
 *       404:
 *         description: User not found
 */
router.post('/forgot-password', authLimiter, auditLogger('FORGOT_PASSWORD', 'user'), forgotPassword);

/**
 * @swagger
 * /api/auth/reset-password:
 *   post:
 *     summary: Reset password using token
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - resetToken
 *               - newPassword
 *             properties:
 *               resetToken:
 *                 type: string
 *                 example: "abcdef123456"
 *               newPassword:
 *                 type: string
 *                 example: "NewSecurePass123"
 *     responses:
 *       200:
 *         description: Password reset successfully
 *       400:
 *         description: Invalid or expired token
 */
router.post('/reset-password', authLimiter, auditLogger('RESET_PASSWORD', 'user'), resetPassword);

module.exports = router;
