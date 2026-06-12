const { Model, DataTypes } = require("sequelize");
const sequelize = require("../config/db");
const crypto = require("crypto");

class Case extends Model {}
Case.init(
  {
    case_id: {
      type: DataTypes.STRING,
      primaryKey: true,
      allowNull: false,
      defaultValue: () => `case-${crypto.randomUUID()}`,
    },
    patient_user_id: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    doctor_user_id: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    symptoms: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    // AI-inferred diagnosis (populated from is_emergency AI response)
    diagnosis: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    // Type of case: general, emergency, or follow_up
    case_type: {
      type: DataTypes.TEXT,
      allowNull: false,
      defaultValue: "general",
    },
    // Severity level of the case
    severity: {
      type: DataTypes.STRING,
      allowNull: true,
      validate: {
        isIn: [["low", "medium", "high", "critical"]],
      },
    },
    // Whether in-person physical care is required
    requires_physical_care: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    },
    triage_classification: {
      type: DataTypes.STRING,
      allowNull: true,
      validate: {
        isIn: [["mild", "moderate", "severe", "emergency"]],
      },
    },
    ai_summary: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    status: {
      type: DataTypes.STRING,
      allowNull: false,
      defaultValue: "open",
      validate: {
        isIn: [["open", "assigned", "in_progress", "closed"]],
      },
    },
    notes: {
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
    closed_at: {
      type: DataTypes.DATE,
      allowNull: true,
    },
  },
  {
    sequelize,
    modelName: "Case",
    tableName: "cases",
    timestamps: false,
  }
);

module.exports = { Case };
