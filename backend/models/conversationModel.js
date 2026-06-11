const { Model, DataTypes } = require("sequelize");
const sequelize = require("../config/db");
const crypto = require("crypto");

class Conversation extends Model {}
Conversation.init(
  {
    conversation_id: {
      type: DataTypes.STRING,
      primaryKey: true,
      allowNull: false,
      defaultValue: () => `conv-${crypto.randomUUID()}`,
    },
    type: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: {
        isIn: [["patient_ai", "doctor_ai", "patient_doctor"]],
      },
    },
    patient_user_id: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    doctor_user_id: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    case_id: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    status: {
      type: DataTypes.STRING,
      allowNull: false,
      defaultValue: "active",
      validate: {
        isIn: [["active", "closed"]],
      },
    },
    created_at: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
    },
    updated_at: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
    },
  },
  {
    sequelize,
    modelName: "Conversation",
    tableName: "conversations",
    timestamps: false,
  }
);

module.exports = { Conversation };
