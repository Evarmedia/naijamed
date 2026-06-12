const express = require('express');
const { getNotifications, createNotificationEndpoint, markAsRead } = require('../controllers/notification.controller');
const { authMiddleware } = require('../middleware/authMiddleware');

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Notifications
 *   description: User notification system
 */

/**
 * @swagger
 * /api/notifications/{userId}:
 *   get:
 *     summary: Get notifications for user
 *     tags: [Notifications]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *       - in: query
 *         name: unreadOnly
 *         schema:
 *           type: boolean
 *       - in: query
 *         name: type
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: List of notifications
 */
router.get('/:userId', authMiddleware, getNotifications);

/**
 * @swagger
 * /api/notifications:
 *   post:
 *     summary: Issue a notification
 *     tags: [Notifications]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - user_id
 *               - type
 *               - title
 *               - content
 *             properties:
 *               user_id:
 *                 type: string
 *               type:
 *                 type: string
 *                 example: general
 *               title:
 *                 type: string
 *               content:
 *                 type: string
 *               reference_id:
 *                 type: string
 *     responses:
 *       201:
 *         description: Notification created
 */
router.post('/', authMiddleware, createNotificationEndpoint);

/**
 * @swagger
 * /api/notifications/{notificationId}/read:
 *   put:
 *     summary: Mark a notification as read
 *     tags: [Notifications]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: notificationId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Marked as read
 */
router.put('/:notificationId/read', authMiddleware, markAsRead);

module.exports = router;
