# API Endpoints Documentation

## Authentication
- **POST** `/api/auth/signup` - Register a new user
- **POST** `/api/auth/login` - User login
- **POST** `/api/auth/verify-otp` - Verify user email via OTP
- **POST** `/api/auth/forgot-password` - Request password reset link
- **POST** `/api/auth/reset-password` - Reset password

## Users (Patients & Doctors)
- **GET** `/api/users/patients/:id` - Get patient profile
- **PUT** `/api/users/patients/:id/profile` - Update patient profile
- **POST** `/api/users/patients/:id/photo` - Upload patient photo
- **GET** `/api/users/patients/:id/history` - Get patient consultation history
- **GET** `/api/users/doctors/:id` - Get doctor profile
- **PUT** `/api/users/doctors/:id/profile` - Update doctor profile
- **POST** `/api/users/doctors/:id/photo` - Upload doctor photo
- **GET** `/api/users/doctors/:id/caselog` - Get doctor case log

## Cases
- **POST** `/api/cases` - Create a new case
- **GET** `/api/cases` - List cases with filters
- **GET** `/api/cases/:id` - Get a specific case
- **PUT** `/api/cases/:id` - Update a case (assign, close, etc.)

## Chat
- **GET** `/api/chats` - List user's active conversations
- **POST** `/api/chats/initiate` - Initiate a new conversation
- **GET** `/api/chats/:conversationId/messages` - Get messages for a conversation
- **POST** `/api/chats/:conversationId/messages` - Send a message to a conversation

## AI Integrations
- **POST** `/api/ai/triage` - Generate a medical triage assessment
- **POST** `/api/ai/patient-assistant` - Patient-facing AI assistant
- **POST** `/api/ai/doctor-assistant` - Doctor-facing clinical AI assistant

## Prescriptions
- **POST** `/api/cases/:caseId/prescriptions` - Create a prescription (Doctor only)
- **GET** `/api/cases/:caseId/prescriptions` - Get all prescriptions for a case

## Notifications
- **GET** `/api/notifications/:userId` - Get notifications for user
- **POST** `/api/notifications` - Issue a notification
- **PUT** `/api/notifications/:notificationId/read` - Mark a notification as read

## Emergencies
- **POST** `/api/emergencies` - Trigger an emergency alert
- **GET** `/api/emergencies` - Get emergency history
- **PUT** `/api/emergencies/:id` - Update emergency status
