const express = require('express');
const {
  getNotifications,
  createNotificationEndpoint,
  markAsRead,
  markAllAsRead,
  clearAllNotifications,
} = require("../controllers/notification.controller");
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
 * /api/notifications:
 *   get:
 *     summary: Get notifications for user
 *     tags: [Notifications]
 *     security:
 *       - bearerAuth: []
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
router.get('/', authMiddleware, getNotifications);

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
 * /api/notifications/{notification_id}/read:
 *   put:
 *     summary: Mark a notification as read
 *     tags: [Notifications]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: notification_id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Marked as read
 */
router.put('/:notification_id/read', authMiddleware, markAsRead);

/**
 * @swagger
 * /api/notifications/read-all:
 *   put:
 *     summary: Mark all notifications as read
 *     tags: [Notifications]
 *     security:    
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: All notifications marked as read
 */
router.put("/read-all", authMiddleware, markAllAsRead);

/**
 * @swagger
 * /api/notifications/clear-all:
 *   delete:
 *     summary: Clear all notifications
 *     tags: [Notifications]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: All notifications cleared
 */
router.delete('/clear-all', authMiddleware, clearAllNotifications);

module.exports = router;
