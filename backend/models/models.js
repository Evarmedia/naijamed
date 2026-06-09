const { User, Patients, Doctors } = require("./userModel");
const { Message } = require("./messagesModel");
const { Conversation } = require("./conversationModel");
const { Case } = require("./caseModel");
const { Prescription } = require("./prescriptionModel");
const { Notification } = require("./notificationModel");
const { EmergencyLog } = require("./emergencyModel");
const { AuditLog } = require("./auditLogModel");

// ── User ↔ Patients / Doctors ──────────────────────────
User.hasOne(Patients, { foreignKey: "user_id", as: "patient" });
Patients.belongsTo(User, { foreignKey: "user_id", as: "user" });

User.hasOne(Doctors, { foreignKey: "user_id", as: "doctor" });
Doctors.belongsTo(User, { foreignKey: "user_id", as: "user" });

// ── Conversations ──────────────────────────────────────
User.hasMany(Conversation, { foreignKey: "patient_id", as: "patientConversations" });
User.hasMany(Conversation, { foreignKey: "doctor_id", as: "doctorConversations" });
Conversation.belongsTo(User, { foreignKey: "patient_id", as: "patient" });
Conversation.belongsTo(User, { foreignKey: "doctor_id", as: "doctor" });

// ── Messages ────────────────────────────────────────────
Conversation.hasMany(Message, { foreignKey: "conversation_id", as: "messages" });
Message.belongsTo(Conversation, { foreignKey: "conversation_id", as: "conversation" });
User.hasMany(Message, { foreignKey: "user_id", as: "messages" });
Message.belongsTo(User, { foreignKey: "user_id", as: "user" });

// ── Cases ───────────────────────────────────────────────
Patients.hasMany(Case, { foreignKey: "patient_id", as: "cases" });
Case.belongsTo(Patients, { foreignKey: "patient_id", as: "patient" });

Doctors.hasMany(Case, { foreignKey: "doctor_id", as: "cases" });
Case.belongsTo(Doctors, { foreignKey: "doctor_id", as: "doctor" });

Conversation.belongsTo(Case, { foreignKey: "case_id", as: "case" });
Case.hasMany(Conversation, { foreignKey: "case_id", as: "conversations" });

// ── Prescriptions ───────────────────────────────────────
Case.hasMany(Prescription, { foreignKey: "case_id", as: "prescriptions" });
Prescription.belongsTo(Case, { foreignKey: "case_id", as: "case" });

Doctors.hasMany(Prescription, { foreignKey: "doctor_id", as: "prescriptions" });
Prescription.belongsTo(Doctors, { foreignKey: "doctor_id", as: "doctor" });

// ── Notifications ───────────────────────────────────────
User.hasMany(Notification, { foreignKey: "user_id", as: "notifications" });
Notification.belongsTo(User, { foreignKey: "user_id", as: "user" });

// ── Emergency Logs ──────────────────────────────────────
User.hasMany(EmergencyLog, { foreignKey: "patient_id", as: "emergencies" });
EmergencyLog.belongsTo(User, { foreignKey: "patient_id", as: "patient" });

Case.hasMany(EmergencyLog, { foreignKey: "case_id", as: "emergencies" });
EmergencyLog.belongsTo(Case, { foreignKey: "case_id", as: "case" });

// ── Audit Logs ──────────────────────────────────────────
User.hasMany(AuditLog, { foreignKey: "user_id", as: "auditLogs" });
AuditLog.belongsTo(User, { foreignKey: "user_id", as: "user" });

module.exports = {
  User,
  Patients,
  Doctors,
  Message,
  Conversation,
  Case,
  Prescription,
  Notification,
  EmergencyLog,
  AuditLog,
};
