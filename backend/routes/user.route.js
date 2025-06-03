const { updatePatientProfile, updateDoctorProfile } = require('../controllers/user.controller.js');
const express = require('express');
const authMiddleware = require('../middleware/authMiddleware.js');

const router = express.Router();

/**
 * @swagger
 * /api/users/patient/profile:
 *   put:
 *     summary: Update patient profile
 *     tags: [Patients]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               full_name:
 *                 type: string
 *                 example: Nikon Packard
 *               date_of_birth:
 *                 type: string
 *                 format: date
 *                 example: "1998-05-15"
 *               gender:
 *                 type: enum
 *                 example: male
 *               nationality:
 *                 type: string
 *                 example: Somalia
 *               profile_url:
 *                 type: string
 *                 example: "https://example.com/profile.jpg"
 *               address:
 *                 type: string
 *                 example: "123 Main St, City, Country"
 *               blood_group:
 *                 type: enum
 *                 example: O+
 *               height:
 *                 type: number
 *                 example: 6
 *               weight:
 *                 type: number
 *                 example: 70
 *     responses:
 *       200:
 *         description: Profile updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 patient:
 *                   type: object
 *                   properties:
 *                     full_name:
 *                       type: string
 *                     email:
 *                       type: string
 *                     phone_number:
 *                       type: string
 *                     date_of_birth:
 *                       type: string
 *                       format: date
 *                     gender:
 *                       type: string
 *                     nationality:
 *                       type: string
 *                     profile_url:
 *                       type: string
 *                     address:
 *                       type: string
 *                     blood_group:
 *                       type: string
 *                     height:
 *                       type: number
 *                     weight:
 *                       type: number
 *       404:
 *         description: Patient not found
 *       500:
 *         description: Internal server error
 */
router.put('/patient/profile', authMiddleware, updatePatientProfile);

/**
 * @swagger
 * /api/users/doctor/profile:
 *   put:
 *     summary: Update doctor profile
 *     tags: [Doctors]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               full_name:
 *                 type: string
 *                 example: John Doe
 *               date_of_birth:
 *                 type: string
 *                 format: date
 *                 example: "1990-01-01"
 *               gender:
 *                 type: string
 *                 example: "male"
 *               nationality:
 *                 type: string
 *                 example: "American"
 *               profile_url:
 *                 type: string
 *                 example: "https://example.com/profile.jpg"
 *               age:
 *                 type: integer
 *                 example: 30
 *               specialization:
 *                 type: string
 *                 example: "Cardiology"
 *               medical_rank:
 *                 type: string
 *                 example: "Senior Consultant"
 *               experience_years:
 *                 type: integer
 *                 example: 5
 *               license_number:
 *                 type: string
 *                 example: "123456"
 *     responses:
 *       200:
 *         description: Doctor Profile updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Doctor Profile updated successfully"
 *                 doctor:
 *                   type: object
 *                   properties:
 *                     full_name:
 *                       type: string
 *                       example: "John Doe"
 *                     email:
 *                       type: string
 *                       example: "johndoe@example.com"
 *                     phone_number:
 *                       type: string
 *                       example: "+1234567890"
 *                     date_of_birth:
 *                       type: string
 *                       format: date
 *                       example: "1990-01-01"
 *                     gender:
 *                       type: string
 *                       example: "male"
 *                     nationality:
 *                       type: string
 *                       example: "American"
 *                     profile_url:
 *                       type: string
 *                       example: "https://example.com/profile.jpg"
 *                     age:
 *                       type: integer
 *                       example: 30
 *                     specialization:
 *                       type: string
 *                       example: "Cardiology"
 *                     medical_rank:
 *                       type: string
 *                       example: "Senior Consultant"
 *                     experience_years:
 *                       type: integer
 *                       example: 5
 *                     license_number:
 *                       type: string
 *                       example: "123456"
 *       404:
 *         description: Doctor not found
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Doctor not found"
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Internal server error"
 */
router.put('/doctor/profile', authMiddleware, updateDoctorProfile);

module.exports = router;