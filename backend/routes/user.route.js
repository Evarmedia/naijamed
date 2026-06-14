const express = require('express');
const {
  updatePatientProfile,
  uploadPatientPhoto,
  updateDoctorProfile,
  uploadDoctorPhoto,
  getPatientHistory,
  getDoctorCaseLog,
  getAllDoctors,
  getUserById,
  getUserProfile
} = require('../controllers/user.controller.js');
const { authMiddleware } = require('../middleware/authMiddleware.js');
const upload = require('../middleware/upload.js');
const { auditLogger } = require('../middleware/auditLogger');

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Patients
 *   description: Patient profile management and history
 */

/**
 * @swagger
 * tags:
 *   name: Doctors
 *   description: Doctor profile management and case logs
 */

/**
 * @swagger
 * tags:
 *   name: Users
 *   description: User profile management
 */


/**
 * @swagger
 * /api/users/profile:
 *   get:
 *     summary: Get logged-in user's profile
 *     description: Returns the authenticated user's profile based on their role. If the user is a patient, it returns the patient profile. If the user is a doctor, it returns the doctor profile.
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: User profile fetched successfully
 *         content:
 *           application/json:
 *             schema:
 *               oneOf:
 *                 - type: object
 *                   properties:
 *                     patient:
 *                       type: object
 *                       description: Patient profile data
 *                 - type: object
 *                   properties:
 *                     doctor:
 *                       type: object
 *                       description: Doctor profile data
 *             examples:
 *               patient:
 *                 summary: Patient profile response
 *                 value:
 *                   patient:
 *                     patient_id: "patient-123"
 *                     user_id: "user-123"
 *                     user:
 *                       user_id: "user-123"
 *                       email: "patient@example.com"
 *                       role: "patient"
 *               doctor:
 *                 summary: Doctor profile response
 *                 value:
 *                   doctor:
 *                     doctor_id: "doctor-123"
 *                     user_id: "user-456"
 *                     user:
 *                       user_id: "user-456"
 *                       email: "doctor@example.com"
 *                       role: "doctor"
 *       401:
 *         description: Unauthorized. Missing or invalid token.
 *       403:
 *         description: Access denied. Invalid profile role.
 *       404:
 *         description: Profile not found.
 *       500:
 *         description: Internal server error.
 */
router.get("/profile", authMiddleware, getUserProfile);

/**
 * @swagger
 * /api/users/profile{user_id}:
 *   get:
 *     summary: Get user by ID
 *     description: Fetches a user's public profile data using their user_id. - for convinence.
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: user_id
 *         required: true
 *         schema:
 *           type: string
 *         description: The unique user ID
 *         example: user-123
 *     responses:
 *       200:
 *         description: User fetched successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: User fetched successfully
 *                 user:
 *                   type: object
 *                   properties:
 *                     user_id:
 *                       type: string
 *                       example: user-123
 *                     email:
 *                       type: string
 *                       example: user@example.com
 *                     role:
 *                       type: string
 *                       example: patient
 *       400:
 *         description: User ID is required
 *       401:
 *         description: Unauthorized. Missing or invalid token.
 *       404:
 *         description: User not found
 *       500:
 *         description: Internal server error
 */
router.get("/:user_id", authMiddleware, getUserById);

/**
 * @swagger
 * /api/users/patients/profile:
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
 *               first_name:
 *                 type: string
 *               last_name:
 *                 type: string
 *               phone_number:
 *                 type: string
 *               date_of_birth:
 *                 type: string
 *                 format: date
 *               gender:
 *                 type: string
 *               address:
 *                 type: string
 *               state:
 *                 type: string
 *               lga:
 *                 type: string
 *               blood_group:
 *                 type: string
 *               genotype:
 *                 type: string
 *               height:
 *                 type: number
 *               weight:
 *                 type: number
 *               allergies:
 *                 type: string
 *               chronic_conditions:
 *                 type: string
 *               medications:
 *                 type: string
 *               emergency_contact_name:
 *                 type: string
 *               emergency_contact_phone:
 *                 type: string
 *               emergency_contact_relationship:
 *                 type: string
 *               next_of_kin_name:
 *                 type: string
 *               next_of_kin_phone:
 *                 type: string
 *               next_of_kin_relationship:
 *                 type: string
 *     responses:
 *       200:
 *         description: Profile updated successfully
 */
router.put('/patients/profile', authMiddleware, auditLogger('UPDATE', 'patient'), updatePatientProfile);

/**
 * @swagger
 * /api/users/patients/photo:
 *   post:
 *     summary: Upload patient profile photo
 *     tags: [Patients]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               photo:
 *                 type: string
 *                 format: binary
 *     responses:
 *       200:
 *         description: Photo uploaded successfully
 */
router.post('/patients/photo', authMiddleware, upload.single('photo'), auditLogger('UPLOAD_PHOTO', 'patient'), uploadPatientPhoto);

/**
 * @swagger
 * /api/users/doctors:
 *   get:
 *     summary: Get all doctors
 *     tags: [Doctors]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of all doctors
 */
router.get('/doctors', authMiddleware, getAllDoctors);

/**
 * @swagger
 * /api/users/doctors/profile:
 *   put:
 *     summary: Update doctor profile
 *     description: Allows an authenticated doctor to update their personal and professional profile information.
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
 *               first_name:
 *                 type: string
 *                 example: John
 *               last_name:
 *                 type: string
 *                 example: Doe
 *               phone_number:
 *                 type: string
 *                 example: "+2348012345678"
 *               date_of_birth:
 *                 type: string
 *                 format: date
 *                 example: "1988-05-20"
 *               gender:
 *                 type: string
 *                 example: male
 *               nationality:
 *                 type: string
 *                 example: Nigerian
 *               profile_url:
 *                 type: string
 *                 example: "https://example.com/profile-image.jpg"
 *               age:
 *                 type: integer
 *                 example: 36
 *               specialization:
 *                 type: string
 *                 example: Cardiology
 *               medical_rank:
 *                 type: string
 *                 example: Consultant
 *               experience_years:
 *                 type: integer
 *                 example: 10
 *               license_number:
 *                 type: string
 *                 example: MDCN-123456
 *               license_expiry_date:
 *                 type: string
 *                 format: date
 *                 example: "2028-12-31"
 *               hospital_affiliation:
 *                 type: string
 *                 example: Lagos University Teaching Hospital
 *               address:
 *                 type: string
 *                 example: "12 Medical Avenue, Ikeja"
 *               state:
 *                 type: string
 *                 example: Lagos
 *     responses:
 *       200:
 *         description: Doctor profile updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Doctor profile updated successfully
 *                 doctor:
 *                   type: object
 *                   properties:
 *                     doctor_id:
 *                       type: string
 *                       example: doctor-123
 *                     user_id:
 *                       type: string
 *                       example: user-123
 *                     age:
 *                       type: integer
 *                       example: 36
 *                     specialization:
 *                       type: string
 *                       example: Cardiology
 *                     medical_rank:
 *                       type: string
 *                       example: Consultant
 *                     experience_years:
 *                       type: integer
 *                       example: 10
 *                     license_number:
 *                       type: string
 *                       example: MDCN-123456
 *                     license_expiry_date:
 *                       type: string
 *                       format: date
 *                       example: "2028-12-31"
 *                     hospital_affiliation:
 *                       type: string
 *                       example: Lagos University Teaching Hospital
 *                     address:
 *                       type: string
 *                       example: "12 Medical Avenue, Ikeja"
 *                     state:
 *                       type: string
 *                       example: Lagos
 *                     user:
 *                       type: object
 *                       properties:
 *                         user_id:
 *                           type: string
 *                           example: user-123
 *                         first_name:
 *                           type: string
 *                           example: John
 *                         last_name:
 *                           type: string
 *                           example: Doe
 *                         phone_number:
 *                           type: string
 *                           example: "+2348012345678"
 *                         role:
 *                           type: string
 *                           example: doctor
 *                         profile_completed:
 *                           type: boolean
 *                           example: true
 *       401:
 *         description: Unauthorized. Missing or invalid token.
 *       403:
 *         description: Access denied.
 *       404:
 *         description: Doctor not found.
 *       500:
 *         description: Internal server error.
 */
router.put('/doctors/profile', authMiddleware, auditLogger('UPDATE', 'doctor'), updateDoctorProfile);

/**
 * @swagger
 * /api/users/doctors/photo:
 *   post:
 *     summary: Upload doctor profile photo
 *     tags: [Doctors]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               photo:
 *                 type: string
 *                 format: binary
 *     responses:
 *       200:
 *         description: Photo uploaded successfully
 */
router.post('/doctors/photo', authMiddleware, upload.single('photo'), auditLogger('UPLOAD_PHOTO', 'doctor'), uploadDoctorPhoto);

/**
 * @swagger
 * /api/users/patients/history:
 *   get:
 *     summary: Get patient consultation history
 *     tags: [Patients]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: severity
 *         schema:
 *           type: string
 *         description: Filter by severity
 *       - in: query
 *         name: start_date
 *         schema:
 *           type: string
 *         description: Start date of the date range
 *       - in: query
 *         name: end_date
 *         schema:
 *           type: string
 *         description: End date of the date range
 *     responses:
 *       200:
 *         description: Patient history retrieved
 */
router.get('/patients/history', authMiddleware, getPatientHistory);

/**
 * @swagger
 * /api/users/doctors/caselog:
 *   get:
 *     summary: Get doctor case log history
 *     tags: [Doctors]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: severity
 *         schema:
 *           type: string
 *         description: Filter by severity
 *       - in: query
 *         name: start_date
 *         schema:
 *           type: string
 *         description: Start date of the date range
 *       - in: query
 *         name: end_date
 *         schema:
 *           type: string
 *         description: End date of the date range
 *     responses:
 *       200:
 *         description: Doctor caselog retrieved
 */
router.get('/doctors/caselog', authMiddleware, getDoctorCaseLog);

module.exports = router;