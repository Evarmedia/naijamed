const express = require('express');
const { triggerEmergency, getEmergencies, updateEmergency } = require('../controllers/emergency.controller');
const { authMiddleware } = require('../middleware/authMiddleware');
const { auditLogger } = require('../middleware/auditLogger');

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Emergencies
 *   description: Emergency escalation system
 */

/**
 * @swagger
 * /api/emergencies:
 *   post:
 *     summary: Trigger an emergency alert
 *     tags: [Emergencies]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               patient_id:
 *                 type: string
 *               location:
 *                 type: string
 *                 example: "123 Lagos St, Ikeja"
 *               latitude:
 *                 type: number
 *               longitude:
 *                 type: number
 *               case_id:
 *                 type: string
 *     responses:
 *       201:
 *         description: Emergency triggered
 */
router.post('/', authMiddleware, auditLogger('TRIGGER', 'emergency'), triggerEmergency);

/**
 * @swagger
 * /api/emergencies:
 *   get:
 *     summary: Get emergency history
 *     tags: [Emergencies]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *       - in: query
 *         name: patient_id
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: List of emergencies
 */
router.get('/', authMiddleware, getEmergencies);

/**
 * @swagger
 * /api/emergencies/{id}:
 *   put:
 *     summary: Update emergency status
 *     tags: [Emergencies]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
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
 *               status:
 *                 type: string
 *                 enum: [triggered, responded, resolved, cancelled]
 *               responder_notes:
 *                 type: string
 *     responses:
 *       200:
 *         description: Emergency updated
 */
router.put('/:id', authMiddleware, auditLogger('UPDATE', 'emergency'), updateEmergency);

module.exports = router;
