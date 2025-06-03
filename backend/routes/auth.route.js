const express = require('express');
const { register, login, verifyEmail, forgotPassword, resetPassword } = require('../controllers/auth.controller');
const {checkRole} = require('../middleware/roleMiddleware.js');
const authMiddleware = require('../middleware/authMiddleware.js');

const router = express.Router();

/**
 * @swagger
 * /api/auth/signup:
 *   post:
 *     summary: A new user can sign up
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               full_name:
 *                 type: string
 *                 description: User Full Name
 *                 example: Nikon Pack
 *               email:
 *                 type: string
 *                 description: User Email
 *                 example: "newuser@example.com"
 *               phone_number:
 *                 type: string
 *                 description: User phone number
 *                 example: "+2348134567888"
 *               password:
 *                 type: string
 *                 description: User password
 *                 example: "Secret@123"
 *               confirm_password:
 *                 type: string
 *                 description: User confirm password
 *                 example: Secret@123
 *               role:
 *                 type: enum
 *                 enum: [patient, doctor]
 *                 description: User role (patient or doctor)
 *     responses:
 *       201:
 *         description: User registered successfully, check your email for verification
 *       400:
 *         description: Bad request
 *
 */
router.post('/signup', register);

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
 *             properties:
 *               phone_number:
 *                 type: string
 *                 description: User Full Name
 *                 example: "+2348134567888"
 *               password:
 *                 type: string
 *                 description: User password
 *                 example: "Secret@123"
 *     responses:
 *       201:
 *         description: User logged in successfully
 *       400:
 *         description: Bad request
 *
 */
router.post('/login', login);

/**
 * @swaggerr
 * /api/auth/verify-email:
 *   post:
 *     summary: Verify user email
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               token:
 *                 type: string
 *                 description: Verification token
 *     responses:
 *       200:
 *         description: Email verified successfully
 *       400:
 *         description: Bad request
 *
 */
router.post('/verify-email', verifyEmail);

/**
 * @swaggerr
 * /api/auth/forgot-password:
 *   post:
 *     summary: Forgot password
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               email:
 *                 type: string
 *                 description: User email
 *     responses:
 *       200:
 *         description: Password reset link sent successfully
 *       400:
 *         description: Bad request
 *
 */
router.post('/forgot-password', forgotPassword);

/**
 * @swaggerr
 * /api/auth/reset-password:
 *   post:
 *     summary: Reset password
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               token:
 *                 type: string
 *                 description: Password reset token
 *               password:
 *                 type: string
 *                 description: New password
 *     responses:
 *       200:
 *         description: Password reset successfully
 *       400:
 *         description: Bad request
 *
 */
router.post('/reset-password', resetPassword);

module.exports = router;
