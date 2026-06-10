const express = require('express');
const { initiateConversation, getMessages, listConversations } = require('../controllers/chat.controller');
const { authMiddleware } = require('../middleware/authMiddleware');

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Chat
 *   description: Messaging and conversation management
 */

/**
 * @swagger
 * /api/chats:
 *   get:
 *     summary: List all active conversations for the current user
 *     tags: [Chat]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of conversations
 */
router.get('/', authMiddleware, listConversations);

/**
 * @swagger
 * /api/chats/initiate:
 *   post:
 *     summary: Initiate a new conversation
 *     tags: [Chat]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - type
 *             properties:
 *               type:
 *                 type: string
 *                 enum: [patient_ai, doctor_ai, patient_doctor]
 *               patient_id:
 *                 type: string
 *               doctor_id:
 *                 type: string
 *               case_id:
 *                 type: string
 *     responses:
 *       201:
 *         description: Conversation initiated
 */
router.post('/initiate', authMiddleware, initiateConversation);

/**
 * @swagger
 * /api/chats/{conversationId}/messages:
 *   get:
 *     summary: Get messages for a conversation
 *     tags: [Chat]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: conversationId
 *         required: true
 *         schema:
 *           type: string
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: List of messages
 */
router.get('/:conversationId/messages', authMiddleware, getMessages);

// /**
//  * @swagger
//  * /api/chats/{conversationId}/messages:
//  *   post:
//  *     summary: Send a message to a conversation via REST API
//  *     tags: [Chat]
//  *     security:
//  *       - bearerAuth: []
//  *     parameters:
//  *       - in: path
//  *         name: conversationId
//  *         required: true
//  *         schema:
//  *           type: string
//  *     requestBody:
//  *       required: true
//  *       content:
//  *         application/json:
//  *           schema:
//  *             type: object
//  *             required:
//  *               - message
//  *             properties:
//  *               message:
//  *                 type: string
//  *               message_type:
//  *                 type: string
//  *                 enum: [text, image]
//  *                 default: text
//  *     responses:
//  *       201:
//  *         description: Message sent successfully
//  */
// router.post('/:conversationId/messages', authMiddleware, sendMessage);

module.exports = router;
