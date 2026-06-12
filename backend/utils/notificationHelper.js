const { Notification } = require("../models/models");

/**
 * Create a notification for a user.
 * @param {string} userId - Target user ID
 * @param {string} type - Notification type: case_assigned | emergency_alert | patient_message | appointment_reminder | general
 * @param {string} title - Short notification title
 * @param {string} content - Notification body
 * @param {string} [referenceId] - Optional reference to related entity (case_id, etc.)
 */
const createNotification = async (userId, type, title, content, referenceId = null) => {
  try {
    const notification = await Notification.create({
      user_id: userId,
      type,
      title,
      content,
      reference_id: referenceId,
    });
    return notification;
  } catch (error) {
    console.error("Error creating notification:", error);
    return null;
  }
};

module.exports = { createNotification };
