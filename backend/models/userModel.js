const { Model, DataTypes } = require("sequelize");
const sequelize = require("../config/db");
const crypto = require("crypto");

class User extends Model {}
User.init(
  {
    user_id: {
      type: DataTypes.STRING,
      primaryKey: true,
      allowNull: false,
      defaultValue: () => `usr-${crypto.randomUUID()}`,
    },
    phone_number: {
      type: DataTypes.STRING,
      allowNull: true,
      unique: true,
    },
    password: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    email: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
    },
    first_name: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    last_name: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    date_of_birth: {
      type: DataTypes.DATE,
      allowNull: true,
      defaultValue: null,
    },
    gender: {
      type: DataTypes.STRING,
      allowNull: true,
      validate: {
        isIn: [["male", "female", "others"]],
      },
    },
    nationality: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    role: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: {
        isIn: [["patient", "doctor"]],
      },
    },
    profile_url: {
      type: DataTypes.STRING,
      allowNull: true,
      defaultValue: null,
    },
    is_verified: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
    verification_token: {
      type: DataTypes.STRING,
      allowNull: true,
      defaultValue: null,
    },
    verification_token_expiry: {
      type: DataTypes.DATE,
      allowNull: true,
      defaultValue: null,
    },
    reset_password_token: {
      type: DataTypes.STRING,
      allowNull: true,
      defaultValue: null,
    },
    reset_password_token_expiry: {
      type: DataTypes.DATE,
      allowNull: true,
      defaultValue: null,
    },
    is_active: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
    },
    created_at: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
    },
    updated_at: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
    },
    last_login: {
      type: DataTypes.DATE,
    },
  },
  {
    sequelize,
    modelName: "User",
    tableName: "users",
    timestamps: false,
  }
);

class Patients extends Model {}

Patients.init(
  {
    patient_id: {
      type: DataTypes.STRING,
      primaryKey: true,
      allowNull: false,
      defaultValue: () => `pat-${crypto.randomUUID()}`,
    },
    user_id: {
      type: DataTypes.STRING,
      allowNull: false,
      references: {
        model: User,
        key: "user_id",
      },
    },
    address: {
      type: DataTypes.STRING,
      allowNull: true,
      defaultValue: null,
    },
    state: {
      type: DataTypes.STRING,
      allowNull: true,
      defaultValue: null,
    },
    lga: {
      type: DataTypes.STRING,
      allowNull: true,
      defaultValue: null,
    },
    blood_group: {
      type: DataTypes.STRING,
      allowNull: true,
      validate: {
        isIn: [["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"]],
      },
    },
    genotype: {
      type: DataTypes.STRING,
      allowNull: true,
      validate: {
        isIn: [["AA", "AS", "SS", "AC", "SC", "CC"]],
      },
    },
    height: {
      type: DataTypes.FLOAT,
      allowNull: true,
      defaultValue: null,
    },
    weight: {
      type: DataTypes.FLOAT,
      allowNull: true,
      defaultValue: null,
    },
    bmi: {
      type: DataTypes.FLOAT,
      allowNull: true,
      defaultValue: null,
    },
    allergies: {
      type: DataTypes.STRING,
      allowNull: true,
      defaultValue: null,
    },
    chronic_conditions: {
      type: DataTypes.STRING,
      allowNull: true,
      defaultValue: null,
    },
    medications: {
      type: DataTypes.STRING,
      allowNull: true,
      defaultValue: null,
    },
    emergency_contact_name: {
      type: DataTypes.STRING,
      allowNull: true,
      defaultValue: null,
    },
    emergency_contact_relationship: {
      type: DataTypes.STRING,
      allowNull: true,
      defaultValue: null,
    },
    emergency_contact_phone: {
      type: DataTypes.STRING,
      allowNull: true,
      defaultValue: null,
    },
    next_of_kin_name: {
      type: DataTypes.STRING,
      allowNull: true,
      defaultValue: null,
    },
    next_of_kin_phone: {
      type: DataTypes.STRING,
      allowNull: true,
      defaultValue: null,
    },
    next_of_kin_relationship: {
      type: DataTypes.STRING,
      allowNull: true,
      defaultValue: null,
    },
  },
  {
    sequelize,
    modelName: "Patients",
    tableName: "patients",
    timestamps: false,
  }
);

class Doctors extends Model {}

Doctors.init(
  {
    doctor_id: {
      type: DataTypes.STRING,
      primaryKey: true,
      allowNull: false,
      defaultValue: () => `doc-${crypto.randomUUID()}`,
    },
    user_id: {
      type: DataTypes.STRING,
      allowNull: false,
      references: {
        model: User,
        key: "user_id",
      },
    },
    age: {
      type: DataTypes.INTEGER,
      allowNull: true,
      defaultValue: null,
    },
    specialization: {
      type: DataTypes.STRING,
      allowNull: true,
      defaultValue: null,
    },
    medical_rank: {
      type: DataTypes.STRING,
      allowNull: true,
      defaultValue: null,
    },
    experience_years: {
      type: DataTypes.INTEGER,
      allowNull: true,
      defaultValue: null,
    },
    license_number: {
      type: DataTypes.STRING,
      allowNull: true,
      defaultValue: null,
    },
    license_expiry_date: {
      type: DataTypes.DATE,
      allowNull: true,
      defaultValue: null,
    },
    hospital_affiliation: {
      type: DataTypes.STRING,
      allowNull: true,
      defaultValue: null,
    },
    address: {
      type: DataTypes.STRING,
      allowNull: true,
      defaultValue: null,
    },
    state: {
      type: DataTypes.STRING,
      allowNull: true,
      defaultValue: null,
    },
  },
  {
    sequelize,
    modelName: "Doctors",
    tableName: "doctors",
    timestamps: false,
  }
);

module.exports = { User, Patients, Doctors };
