const express = require('express');
const { createPrescription, getPrescriptions } = require('../controllers/prescription.controller');
const { authMiddleware } = require('../middleware/authMiddleware');
const { checkRole } = require('../middleware/roleMiddleware');
const { auditLogger } = require('../middleware/auditLogger');

const router = express.Router({ mergeParams: true }); // mergeParams so we can use case_id from parent route if needed

/**
 * @swagger
 * tags:
 *   name: Prescriptions
 *   description: Case-linked prescription management
 */

/**
 * @swagger
 * /api/cases/{case_id}/prescriptions:
 *   post:
 *     summary: Create a prescription for a case (Doctor Only)
 *     tags: [Prescriptions]
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
 *               drugs:
 *                 type: array
 *                 description: "List of drugs in this prescription (preferred format)"
 *                 items:
 *                   type: object
 *                   required:
 *                     - drug_name
 *                     - dosage
 *                     - frequency
 *                     - duration
 *                   properties:
 *                     drug_name:
 *                       type: string
 *                       example: "Artemether/Lumefantrine"
 *                     dosage:
 *                       type: string
 *                       example: "80/480mg"
 *                     frequency:
 *                       type: string
 *                       example: "Twice daily"
 *                     duration:
 *                       type: string
 *                       example: "3 days"
 *                     instructions:
 *                       type: string
 *                       example: "Take with meals containing fat."
 *               drug_name:
 *                 type: string
 *                 description: "Single drug format (fallback)"
 *                 example: "Artemether/Lumefantrine"
 *               dosage:
 *                 type: string
 *                 description: "Single drug format (fallback)"
 *                 example: "80/480mg"
 *               frequency:
 *                 type: string
 *                 description: "Single drug format (fallback)"
 *                 example: "Twice daily"
 *               duration:
 *                 type: string
 *                 description: "Single drug format (fallback)"
 *                 example: "3 days"
 *               instructions:
 *                 type: string
 *                 description: "Single drug format (fallback)"
 *                 example: "Take with meals containing fat."
 *     responses:
 *       201:
 *         description: Prescription created
 */
// Only allow doctors to prescribe
router.post('/cases/:case_id/prescriptions', authMiddleware, checkRole('doctor'), auditLogger('CREATE', 'prescription'), createPrescription);

/**
 * @swagger
 * /api/cases/{case_id}/prescriptions:
 *   get:
 *     summary: Get all prescriptions for a case
 *     tags: [Prescriptions]
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
 *         description: List of prescriptions
 */
router.get('/cases/:case_id/prescriptions', authMiddleware, getPrescriptions);

module.exports = router;
