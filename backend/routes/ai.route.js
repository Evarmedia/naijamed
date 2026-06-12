const express = require('express');
const { triage, patientAssistant, doctorAssistant } = require('../controllers/ai.controller');
const { authMiddleware } = require('../middleware/authMiddleware');

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: AI
 *   description: AI services for triage and medical assistance
 */

/**
 * @swagger
 * /api/ai//symptom-assessment:
 *   post:
 *     summary: Generate a medical triage assessment
 *     tags: [AI]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - symptoms
 *             properties:
 *               symptoms:
 *                 type: string
 *                 example: "Fever, chills, and headache"
 *               duration:
 *                 type: string
 *                 example: "3 days"
 *               severity:
 *                 type: string
 *                 example: "Moderate"
 *               associated_symptoms:
 *                 type: string
 *                 example: "Nausea"
 *     responses:
 *       200:
 *         description: Triage assessment success
 */
router.post('/symptom-assessment', authMiddleware, triage);

/**
 * @swagger
 * /api/ai/patient-assistant:
 *   post:
 *     summary: Patient-facing AI assistant 
 *     tags: [AI]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - question
 *             properties:
 *               question:
 *                 type: string
 *                 example: "What should I eat when recovering from typhoid?"
 *     responses:
 *       200:
 *         description: Response generated
 */
router.post('/patient-assistant', authMiddleware, patientAssistant);

// /**
//  * @swagger
//  * /api/ai/doctor-assistant:
//  *   post:
//  *     summary: Doctor-facing clinical AI assistant
//  *     tags: [AI]
//  *     security:
//  *       - bearerAuth: []
//  *     requestBody:
//  *       required: true
//  *       content:
//  *         application/json:
//  *           schema:
//  *             type: object
//  *             required:
//  *               - question
//  *             properties:
//  *               question:
//  *                 type: string
//  *                 example: "What is the recommended first-line treatment for uncomplicated falciparum malaria?"
//  *     responses:
//  *       200:
//  *         description: Response generated in clinical terminology
//  */
// router.post('/doctor-assistant', authMiddleware, doctorAssistant);

module.exports = router;
