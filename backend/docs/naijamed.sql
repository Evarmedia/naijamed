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
    is_verified BOOLEAN DEFAULT TRUE,
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
    blood_group TEXT CHECK(
        blood_group IN ('A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-')
    ),
    height REAL CHECK(height > 0),
    weight REAL CHECK(weight > 0),
    allergies TEXT,
    emergency_contact_name TEXT,
    emergency_contact_phone TEXT,
    emergency_contact_relationship TEXT,

    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE ON UPDATE CASCADE
);

--DOCTORS TABLE
CREATE TABLE doctors (
    doctor_id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    age INTEGER CHECK(age > 0),
    specialization TEXT,
    -- medical_rank TEXT CHECK(
        -- medical_rank IN ('intern', 'resident', 'consultant', 'specialist', 'attending')
    -- ),
    medical_rank TEXT,
    experience_years INTEGER CHECK(experience_years >= 0),
    license_number TEXT UNIQUE,
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
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    FOREIGN KEY (patient_id) REFERENCES patients(patient_id) ON DELETE CASCADE ON UPDATE CASCADE,
)

-- Messages with ai table
CREATE TABLE messages (
    message_id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    message TEXT NOT NULL,
    identifier TEXT CHECK(indentifier IN ('agent', 'human')),
    timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    is_read BOOLEAN DEFAULT FALSE,
    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE ON UPDATE CASCADE,
);


-- Index for users table on email and phone_number for quick lookup
CREATE INDEX idx_users_email ON users(email);

CREATE INDEX idx_users_phone_number ON users(phone_number);

CREATE INDEX idx_users_user_id ON users(user_id);