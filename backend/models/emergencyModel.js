const { Model, DataTypes } = require("sequelize");
const sequelize = require("../config/db");
const crypto = require("crypto");

class EmergencyLog extends Model {}
EmergencyLog.init(
  {
    emergency_id: {
      type: DataTypes.STRING,
      primaryKey: true,
      allowNull: false,
      defaultValue: () => `emg-${crypto.randomUUID()}`,
    },
    patient_id: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    case_id: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    location: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    latitude: {
      type: DataTypes.FLOAT,
      allowNull: true,
    },
    longitude: {
      type: DataTypes.FLOAT,
      allowNull: true,
    },
    status: {
      type: DataTypes.STRING,
      allowNull: false,
      defaultValue: "triggered",
      validate: {
        isIn: [["triggered", "responded", "resolved", "cancelled"]],
      },
    },
    responder_notes: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    created_at: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
    },
    updated_at: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
    },
    resolved_at: {
      type: DataTypes.DATE,
      allowNull: true,
    },
  },
  {
    sequelize,
    modelName: "EmergencyLog",
    tableName: "emergency_logs",
    timestamps: false,
  }
);

module.exports = { EmergencyLog };
