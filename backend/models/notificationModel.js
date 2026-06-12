const { Model, DataTypes } = require("sequelize");
const sequelize = require("../config/db");
const crypto = require("crypto");

class Notification extends Model {}
Notification.init(
  {
    notification_id: {
      type: DataTypes.STRING,
      primaryKey: true,
      allowNull: false,
      defaultValue: () => `notif-${crypto.randomUUID()}`,
    },
    user_id: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    type: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: {
        isIn: [
          [
            "case_assigned",
            "emergency_alert",
            "patient_message",
            "appointment_reminder",
            "general",
          ],
        ],
      },
    },
    title: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    content: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    reference_id: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    is_read: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
    created_at: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
    },
  },
  {
    sequelize,
    modelName: "Notification",
    tableName: "notifications",
    timestamps: false,
  }
);

module.exports = { Notification };
