const express = require('express');
const {
  getPatientById,
  updatePatientProfile,
  uploadPatientPhoto,
  getDoctorById,
  updateDoctorProfile,
  uploadDoctorPhoto,
  getPatientHistory,
  getDoctorCaseLog,
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
 * /api/users/patients/{user_id}:
 *   get:
 *     summary: Get patient profile by ID
 *     tags: [Patients]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: user_id
 *         schema:
 *           type: string
 *         required: true
 *         description: User ID for the patient
 *     responses:
 *       200:
 *         description: Patient profile data
 *       404:
 *         description: Patient not found
 */
router.get('/patients/:user_id', authMiddleware, getPatientById);

/**
 * @swagger
 * /api/users/patients/{user_id}/profile:
 *   put:
 *     summary: Update patient profile
 *     tags: [Patients]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: user_id
 *         schema:
 *           type: string
 *         required: true
 *         description: User ID for the patient
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
 *     responses:
 *       200:
 *         description: Profile updated successfully
 */
router.put('/patients/:user_id/profile', authMiddleware, auditLogger('UPDATE', 'patient'), updatePatientProfile);

/**
 * @swagger
 * /api/users/patients/{user_id}/photo:
 *   post:
 *     summary: Upload patient profile photo
 *     tags: [Patients]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: user_id
 *         schema:
 *           type: string
 *         required: true
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
router.post('/patients/:user_id/photo', authMiddleware, upload.single('photo'), auditLogger('UPLOAD_PHOTO', 'patient'), uploadPatientPhoto);

/**
 * @swagger
 * /api/users/doctors/{user_id}:
 *   get:
 *     summary: Get doctor profile by ID
 *     tags: [Doctors]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: user_id
 *         schema:
 *           type: string
 *         required: true
 *     responses:
 *       200:
 *         description: Doctor profile data
 */
router.get('/doctors/:user_id', authMiddleware, getDoctorById);

/**
 * @swagger
 * /api/users/doctors/{user_id}/profile:
 *   put:
 *     summary: Update doctor profile
 *     tags: [Doctors]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: user_id
 *         schema:
 *           type: string
 *         required: true
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               first_name:
 *                 type: string
 *               specialization:
 *                 type: string
 *               experience_years:
 *                 type: integer
 *               hospital_affiliation:
 *                 type: string
 *     responses:
 *       200:
 *         description: Doctor Profile updated successfully
 */
router.put('/doctors/:user_id/profile', authMiddleware, auditLogger('UPDATE', 'doctor'), updateDoctorProfile);

/**
 * @swagger
 * /api/users/doctors/{user_id}/photo:
 *   post:
 *     summary: Upload doctor profile photo
 *     tags: [Doctors]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: user_id
 *         schema:
 *           type: string
 *         required: true
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
router.post('/doctors/:user_id/photo', authMiddleware, upload.single('photo'), auditLogger('UPLOAD_PHOTO', 'doctor'), uploadDoctorPhoto);

/**
 * @swagger
 * /api/users/patients/{user_id}/history:
 *   get:
 *     summary: Get patient consultation history
 *     tags: [Patients]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: user_id
 *         schema:
 *           type: string
 *         required: true
 *       - in: query
 *         name: severity
 *         schema:
 *           type: string
 *         description: Filter by severity
 *     responses:
 *       200:
 *         description: Patient history retrieved
 */
router.get('/patients/:user_id/history', authMiddleware, getPatientHistory);

/**
 * @swagger
 * /api/users/doctors/{user_id}/caselog:
 *   get:
 *     summary: Get doctor case log history
 *     tags: [Doctors]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: user_id
 *         schema:
 *           type: string
 *         required: true
 *     responses:
 *       200:
 *         description: Doctor caselog retrieved
 */
router.get('/doctors/:user_id/caselog', authMiddleware, getDoctorCaseLog);

module.exports = router;