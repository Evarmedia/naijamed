const express = require('express');
const {
  triggerEmergency,
  confirmEmergency,
  declineEmergency,
  acceptEmergency,
  declineDoctorEmergency,
  getEmergencies,
  updateEmergency,
} = require('../controllers/emergency.controller');
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
 *     summary: Trigger a manual emergency alert
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
 *               patient_user_id:
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
 * /api/emergencies/confirm/{case_id}:
 *   post:
 *     summary: Patient confirms they want to see a doctor (triggers doctor search)
 *     tags: [Emergencies]
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
 *         description: Doctors are being notified
 */
router.post('/confirm/:case_id', authMiddleware, confirmEmergency);

/**
 * @swagger
 * /api/emergencies/decline/{case_id}:
 *   post:
 *     summary: Patient declines to see a doctor (cancels the emergency)
 *     tags: [Emergencies]
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
 *         description: Emergency declined
 */
router.post('/decline/:case_id', authMiddleware, declineEmergency);

/**
 * @swagger
 * /api/emergencies/accept/{case_id}:
 *   post:
 *     summary: Doctor accepts an emergency case (first to accept wins)
 *     tags: [Emergencies]
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
 *         description: Case accepted, patient-doctor conversation created
 */
router.post('/accept/:case_id', authMiddleware, auditLogger('ACCEPT', 'emergency'), acceptEmergency);

/**
 * @swagger
 * /api/emergencies/decline-doctor/{case_id}:
 *   post:
 *     summary: Doctor declines an emergency case (won't be prompted again)
 *     tags: [Emergencies]
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
 *         description: Case declined by doctor
 */
router.post('/decline-doctor/:case_id', authMiddleware, declineDoctorEmergency);

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
