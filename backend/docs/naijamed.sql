-- Enable foreign key support for each session
PRAGMA foreign_keys = ON;

.header on
.mode column
-- SQLite Database Schema for NaijaMed
-- This schema is designed to support a healthcare management system with various entities and relationships.
-- Core Entity Tables
CREATE TABLE users (
    user_id TEXT PRIMARY KEY,
    phone_number TEXT UNIQUE,
    password TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    first_name TEXT NOT NULL,
    last_name TEXT NOT NULL,
    date_of_birth DATE,
    gender TEXT CHECK(gender IN ('male', 'female', 'others')),
    nationality TEXT,
    role TEXT CHECK(role IN ('patient', 'doctor')) NOT NULL,
    profile_url TEXT,
    is_verified BOOLEAN DEFAULT FALSE,
    verification_token TEXT,
    verification_token_expiry DATETIME,
    reset_password_token TEXT,
    reset_password_token_expiry DATETIME,
    is_active BOOLEAN DEFAULT TRUE,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    last_login DATETIME
);

-- Patients Table
CREATE TABLE patients (
    patient_id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    address TEXT,
    state TEXT,
    lga TEXT,
    blood_group TEXT CHECK(
        blood_group IN ('A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-')
    ),
    genotype TEXT CHECK(genotype IN ('AA', 'AS', 'SS', 'AC', 'SC', 'CC')),
    height REAL CHECK(height > 0),
    weight REAL CHECK(weight > 0),
    allergies TEXT,
    chronic_conditions TEXT,
    medications TEXT,
    bmi REAL CHECK(bmi > 0),
    emergency_contact_name TEXT,
    emergency_contact_phone TEXT,
    emergency_contact_relationship TEXT,
    next_of_kin_name TEXT,
    next_of_kin_phone TEXT,
    next_of_kin_relationship TEXT,
    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE ON UPDATE CASCADE
);

-- Doctors Table
CREATE TABLE doctors (
    doctor_id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    age INTEGER CHECK(age > 0),
    specialization TEXT,
    medical_rank TEXT,
    experience_years INTEGER CHECK(experience_years >= 0),
    license_number TEXT UNIQUE,
    license_expiry_date DATE,
    hospital_affiliation TEXT,
    address TEXT,
    state TEXT,
    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE ON UPDATE CASCADE
);

-- Symptoms Table
CREATE TABLE symptoms (
    symptom_id TEXT PRIMARY KEY,
    patient_id TEXT NOT NULL,
    name TEXT NOT NULL,
    description TEXT,
    when_occurred DATE,
    severity TEXT CHECK(severity IN ('mild', 'moderate', 'severe')),
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (patient_id) REFERENCES patients(patient_id) ON DELETE CASCADE ON UPDATE CASCADE
);

-- Conversations Table
CREATE TABLE conversations (
    conversation_id TEXT PRIMARY KEY,
    type TEXT CHECK(type IN ('patient_ai', 'doctor_ai', 'patient_doctor')) NOT NULL,
    patient_id TEXT,
    doctor_id TEXT,
    case_id TEXT,
    status TEXT CHECK(status IN ('active', 'closed')) DEFAULT 'active',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (patient_id) REFERENCES users(user_id) ON DELETE SET NULL ON UPDATE CASCADE,
    FOREIGN KEY (doctor_id) REFERENCES users(user_id) ON DELETE SET NULL ON UPDATE CASCADE
);

-- Messages Table
CREATE TABLE messages (
    message_id TEXT PRIMARY KEY,
    conversation_id TEXT,
    user_id TEXT NOT NULL,
    message TEXT NOT NULL,
    message_type TEXT CHECK(message_type IN ('text', 'image')) DEFAULT 'text',
    identifier TEXT CHECK(identifier IN ('agent', 'human')),
    sender_role TEXT CHECK(sender_role IN ('patient', 'doctor', 'ai')),
    timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    is_read BOOLEAN DEFAULT FALSE,
    is_emergency BOOLEAN DEFAULT FALSE,
    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE ON UPDATE CASCADE,
    FOREIGN KEY (conversation_id) REFERENCES conversations(conversation_id) ON DELETE SET NULL ON UPDATE CASCADE
);

-- Cases Table
CREATE TABLE cases (
    case_id TEXT PRIMARY KEY,
    patient_id TEXT NOT NULL,
    doctor_id TEXT,
    symptoms TEXT,
    severity TEXT CHECK(severity IN ('mild', 'moderate', 'severe', 'emergency')),
    ai_summary TEXT,
    status TEXT CHECK(status IN ('open', 'assigned', 'in_progress', 'closed')) DEFAULT 'open',
    notes TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    closed_at DATETIME,
    FOREIGN KEY (patient_id) REFERENCES patients(patient_id) ON DELETE CASCADE ON UPDATE CASCADE,
    FOREIGN KEY (doctor_id) REFERENCES doctors(doctor_id) ON DELETE SET NULL ON UPDATE CASCADE
);

-- Prescriptions Table
CREATE TABLE prescriptions (
    prescription_id TEXT PRIMARY KEY,
    case_id TEXT NOT NULL,
    doctor_id TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (case_id) REFERENCES cases(case_id) ON DELETE CASCADE ON UPDATE CASCADE,
    FOREIGN KEY (doctor_id) REFERENCES doctors(doctor_id) ON DELETE CASCADE ON UPDATE CASCADE
);

-- Drugs Table
CREATE TABLE drugs (
    drug_id TEXT PRIMARY KEY,
    prescription_id TEXT NOT NULL,
    drug_name TEXT NOT NULL,
    dosage TEXT NOT NULL,
    frequency TEXT NOT NULL,
    duration TEXT NOT NULL,
    instructions TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (prescription_id) REFERENCES prescriptions(prescription_id) ON DELETE CASCADE ON UPDATE CASCADE
);

-- Notifications Table
CREATE TABLE notifications (
    notification_id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    type TEXT CHECK(type IN ('case_assigned', 'emergency_alert', 'patient_message', 'appointment_reminder', 'general')) NOT NULL,
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    reference_id TEXT,
    is_read BOOLEAN DEFAULT FALSE,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE ON UPDATE CASCADE
);

-- Emergency Logs Table
CREATE TABLE emergency_logs (
    emergency_id TEXT PRIMARY KEY,
    patient_id TEXT NOT NULL,
    case_id TEXT,
    location TEXT,
    latitude REAL,
    longitude REAL,
    status TEXT CHECK(status IN ('triggered', 'responded', 'resolved', 'cancelled')) DEFAULT 'triggered',
    responder_notes TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    resolved_at DATETIME,
    FOREIGN KEY (patient_id) REFERENCES users(user_id) ON DELETE CASCADE ON UPDATE CASCADE,
    FOREIGN KEY (case_id) REFERENCES cases(case_id) ON DELETE SET NULL ON UPDATE CASCADE
);

-- Audit Logs Table
CREATE TABLE audit_logs (
    log_id TEXT PRIMARY KEY,
    user_id TEXT,
    action TEXT NOT NULL,
    resource TEXT NOT NULL,
    resource_id TEXT,
    details TEXT,
    ip_address TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE SET NULL ON UPDATE CASCADE
);

-- Indexes
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_phone_number ON users(phone_number);
CREATE INDEX idx_users_user_id ON users(user_id);
CREATE INDEX idx_cases_patient_id ON cases(patient_id);
CREATE INDEX idx_cases_doctor_id ON cases(doctor_id);
CREATE INDEX idx_cases_status ON cases(status);
CREATE INDEX idx_messages_conversation_id ON messages(conversation_id);
CREATE INDEX idx_notifications_user_id ON notifications(user_id);
CREATE INDEX idx_prescriptions_case_id ON prescriptions(case_id);
CREATE INDEX idx_drugs_prescription_id ON drugs(prescription_id);
CREATE INDEX idx_emergency_logs_patient_id ON emergency_logs(patient_id);
CREATE INDEX idx_audit_logs_user_id ON audit_logs(user_id);