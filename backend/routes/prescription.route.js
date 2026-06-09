const express = require('express');
const { createPrescription, getPrescriptions } = require('../controllers/prescription.controller');
const { authMiddleware } = require('../middleware/authMiddleware');
const { checkRole } = require('../middleware/roleMiddleware');
const { auditLogger } = require('../middleware/auditLogger');

const router = express.Router({ mergeParams: true }); // mergeParams so we can use caseId from parent route if needed

/**
 * @swagger
 * tags:
 *   name: Prescriptions
 *   description: Case-linked prescription management
 */

/**
 * @swagger
 * /api/cases/{caseId}/prescriptions:
 *   post:
 *     summary: Create a prescription for a case (Doctor Only)
 *     tags: [Prescriptions]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: caseId
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - drug_name
 *               - dosage
 *               - frequency
 *               - duration
 *             properties:
 *               drug_name:
 *                 type: string
 *                 example: "Artemether/Lumefantrine"
 *               dosage:
 *                 type: string
 *                 example: "80/480mg"
 *               frequency:
 *                 type: string
 *                 example: "Twice daily"
 *               duration:
 *                 type: string
 *                 example: "3 days"
 *               instructions:
 *                 type: string
 *                 example: "Take with meals containing fat."
 *     responses:
 *       201:
 *         description: Prescription created
 */
// Only allow doctors to prescribe
router.post('/cases/:caseId/prescriptions', authMiddleware, checkRole('doctor'), auditLogger('CREATE', 'prescription'), createPrescription);

/**
 * @swagger
 * /api/cases/{caseId}/prescriptions:
 *   get:
 *     summary: Get all prescriptions for a case
 *     tags: [Prescriptions]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: caseId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: List of prescriptions
 */
router.get('/cases/:caseId/prescriptions', authMiddleware, getPrescriptions);

module.exports = router;
