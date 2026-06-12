const { Model, DataTypes } = require("sequelize");
const sequelize = require("../config/db");
const crypto = require("crypto");

class Message extends Model {}
Message.init(
  {
    message_id: {
      type: DataTypes.STRING,
      primaryKey: true,
      allowNull: false,
      defaultValue: () => `msg-${crypto.randomUUID()}`,
    },
    conversation_id: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    user_id: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    message: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    message_type: {
      type: DataTypes.STRING,
      allowNull: true,
      defaultValue: "text",
      validate: {
        isIn: [["text", "image"]],
      },
    },
    identifier: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: {
        isIn: [["human", "agent"]],
      },
    },
    sender_role: {
      type: DataTypes.STRING,
      allowNull: true,
      validate: {
        isIn: [["patient", "doctor", "ai"]],
      },
    },
    timestamp: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
    created_at: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
    is_read: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
    is_emergency: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
  },
  {
    sequelize,
    modelName: "Message",
    tableName: "messages",
    timestamps: false,
  }
);

module.exports = { Message };
