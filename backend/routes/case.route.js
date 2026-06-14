const express = require('express');
const { createCase, getCaseById, updateCase, listCases } = require('../controllers/case.controller');
const { authMiddleware } = require('../middleware/authMiddleware');
const { auditLogger } = require('../middleware/auditLogger');

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Cases
 *   description: Triage and medical case management
 */

/**
 * @swagger
 * /api/cases:
 *   post:
 *     summary: Create a new case
 *     tags: [Cases]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - patient_id
 *             properties:
 *               patient_id:
 *                 type: string
 *                 example: "pat-123"
 *               symptoms:
 *                 type: string
 *                 example: "Severe headache"
 *               severity:
 *                 type: string
 *                 enum: [mild, moderate, severe, emergency]
 *                 example: severe
 *               ai_summary:
 *                 type: string
 *               doctor_id:
 *                 type: string
 *     responses:
 *       201:
 *         description: Case created successfully
 */
router.post('/', authMiddleware, auditLogger('CREATE', 'case'), createCase);

/**
 * @swagger
 * /api/cases:
 *   get:
 *     summary: List cases with filters
 *     tags: [Cases]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: doctorId
 *         schema:
 *           type: string
 *       - in: query
 *         name: patientId
 *         schema:
 *           type: string
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [open, assigned, in_progress, closed]
 *       - in: query
 *         name: severity
 *         schema:
 *           type: string
 *           enum: [mild, moderate, severe, emergency]
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: List of cases
 */
router.get('/', authMiddleware, listCases);

/**
 * @swagger
 * /api/cases/{case_id}:
 *   get:
 *     summary: Get a specific case
 *     tags: [Cases]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: case_id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Case details
 */
router.get('/:case_id', authMiddleware, getCaseById);

/**
 * @swagger
 * /api/cases/{case_id}:
 *   put:
 *     summary: Update a case (assign doctor, change status, add notes)
 *     tags: [Cases]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: case_id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               doctor_id:
 *                 type: string
 *               status:
 *                 type: string
 *                 enum: [open, assigned, in_progress, closed]
 *               notes:
 *                 type: string
 *               severity:
 *                 type: string
 *     responses:
 *       200:
 *         description: Case updated successfully
 */
router.put('/:case_id', authMiddleware, auditLogger('UPDATE', 'case'), updateCase);

module.exports = router;
