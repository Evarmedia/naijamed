const { Notification } = require("../models/models");

// GET /notifications/
const getNotifications = async (req, res) => {
  try {
    const user_id = req.user.user_id;
    const { unreadOnly, type, page = 1, limit = 20 } = req.query;

    const where = { user_id };
    if (unreadOnly === true) {
      where.is_read = false;
    }
    if (type) {
      where.type = type;
    }

    const offset = (parseInt(page) - 1) * parseInt(limit);

    const { count, rows: notifications } = await Notification.findAndCountAll({
      where,
      order: [["created_at", "DESC"]],
      limit: parseInt(limit),
      offset,
    });

    return res.status(200).json({
      notifications,
      pagination: {
        total: count,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(count / parseInt(limit)),
      },
    });
  } catch (error) {
    console.error("Error fetching notifications:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

// POST /notifications — create a notification (admin/system use)
const createNotificationEndpoint = async (req, res) => {
  try {
    const { user_id, type, title, content, reference_id } = req.body;

    if (!user_id || !type || !title || !content) {
      return res.status(400).json({
        message: "user_id, type, title, and content are required",
      });
    }

    const notification = await Notification.create({
      user_id,
      type,
      title,
      content,
      reference_id: reference_id || null,
    });

    return res.status(201).json({
      message: "Notification created successfully",
      notification,
    });
  } catch (error) {
    console.error("Error creating notification:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

// PUT /notifications/:notification_id/read — mark as read
const markAsRead = async (req, res) => {
  try {
    const { notification_id } = req.params;

    const notification = await Notification.findByPk(notification_id);
    if (!notification) {
      return res.status(404).json({ message: "Notification not found" });
    }

    if (notification.user_id !== req.user.user_id) {
      return res.status(403).json({ message: "Access denied" });
    }

    await notification.update({ is_read: true });

    return res.status(200).json({
      message: "Notification marked as read",
      notification,
    });
  } catch (error) {
    console.error("Error marking notification as read:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

// PUT /notifications/read-all — mark all as read
const markAllAsRead = async (req, res) => {
  try {
    const user_id = req.user.user_id;

    const notification = await Notification.update(
      { is_read: true },
      { where: { user_id } }
    );

    return res.status(200).json({
      message: "All notifications marked as read",
      notification,
    });
  } catch (error) {
    console.error("Error marking all notifications as read:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

// DELETE /notifications/clear-all — clear all notifications
const clearAllNotifications = async (req, res) => {
  try {
    const user_id = req.user.user_id;

    const notification = await Notification.destroy({
      where: { user_id },
    });

    return res.status(200).json({
      message: "All notifications cleared",
      notification,
    });
  } catch (error) {
    console.error("Error clearing all notifications:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

module.exports = {
  getNotifications,
  createNotificationEndpoint,
  markAsRead,
  markAllAsRead,
  clearAllNotifications,
};
