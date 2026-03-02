# Architecture & System Design

## System Architecture Overview

```
┌─────────────────────────────────────────────────────────────────────┐
│                         End Users                                    │
│     (Patients, Doctors, Staff, Admins)                              │
└────────────────┬────────────────────────────────────────────────────┘
                 │
    ┌────────────┴────────────┐
    │                         │
┌───▼────────────────────┐  ┌▼────────────────────────┐
│   Next.js Frontend     │  │  Mobile App (Future)    │
│  (React 18, TypeScript)│  │  (React Native/Flutter) │
│  - Dashboard           │  └─────────────────────────┘
│  - Patient Portal      │
│  - Doctor Panel        │
│  - Admin Console       │
└───┬──────────────────┬─┘
    │                  │
    │                  │
┌───▼──────────────────▼───────────────────────────────────────┐
│              AWS CloudFront (CDN)                             │
│              API Gateway / ALB (Load Balancer)                │
└───┬──────────────────────────────────────────────────────────┘
    │
┌───▼──────────────────────────────────────────────────────────┐
│         NestJS REST API (Microservices Ready)                 │
│                                                               │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐       │
│  │   Auth       │  │   Patient    │  │ Appointment  │       │
│  │   Module     │  │   Module     │  │   Module     │       │
│  └──────────────┘  └──────────────┘  └──────────────┘       │
│                                                               │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐       │
│  │   Doctor     │  │ Prescription │  │   Billing    │       │
│  │   Module     │  │   Module     │  │   Module     │       │
│  └──────────────┘  └──────────────┘  └──────────────┘       │
│                                                               │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐       │
│  │ Laboratory   │  │  Pharmacy    │  │  Dashboard   │       │
│  │   Module     │  │   Module     │  │   Module     │       │
│  └──────────────┘  └──────────────┘  └──────────────┘       │
│                                                               │
│  Shared Services:                                             │
│  - Authentication & Authorization (JWT + RBAC)               │
│  - File Upload (S3)                                           │
│  - Audit Logging                                              │
│  - Email Notifications                                        │
│  - PDF Generation                                             │
└───┬──────────────────────────────────────────────────────────┘
    │
    ├──────────────────────┬──────────────────────┬────────────┐
    │                      │                      │            │
┌───▼─────────────┐  ┌────▼────────────┐  ┌────▼────────┐   │
│  PostgreSQL     │  │  AWS S3         │  │  Redis      │   │
│  Database       │  │  (Medical Docs) │  │  (Cache)    │   │
│  - User Data    │  │  - Encrypted    │  │             │   │
│  - EMR/EHR      │  │  - Versioned    │  │             │   │
│  - Transactions │  │  - Accessible   │  │             │   │
│  - Audit Logs   │  │    via Presigned│  │             │   │
│  - Soft Deletes │  │    URLs         │  │             │   │
└─────────────────┘  └─────────────────┘  └─────────────┘   │
                                                             │
                     ┌────────────────────────┐              │
                     │   AWS Services         │              │
                     │ - CloudWatch (Logs)    │◄─────────────┘
                     │ - SNS (Notifications)  │
                     │ - SES (Email)          │
                     │ - CodeDeploy (CI/CD)   │
                     └────────────────────────┘
```

## Modular Architecture

### Core Modules

#### 1. **Authentication Module** (`auth`)
- JWT token management
- Refresh token rotation
- Password hashing (bcrypt)
- MFA support
- Session management

#### 2. **User Management** (`users`)
- User profiles
- Role assignment
- Status management
- Deletion tracking

#### 3. **Patient Management** (`patients`)
- Patient demographics
- Medical history
- Allergies & medications
- Insurance information
- Medical records (EMR/EHR)

#### 4. **Doctor Management** (`doctors`)
- Doctor profiles
- Specializations
- Qualifications
- Availability slots
- Rating system

#### 5. **Appointment Scheduling** (`appointments`)
- Appointment booking
- Conflict detection
- Status tracking
- Rescheduling
- Cancellation

#### 6. **Prescription Management** (`prescriptions`)
- E-prescription creation
- PDF generation
- Digital signatures
- Pharmacy notifications
- Recurring prescriptions

#### 7. **Billing & Invoicing** (`billing`)
- Invoice generation
- Payment tracking
- Insurance claims
- Tax calculations
- Revenue reports

#### 8. **Laboratory Module** (`laboratory`)
- Test ordering
- Sample tracking
- Result management
- Report generation
- Quality control

#### 9. **Pharmacy Module** (`pharmacy`)
- Medicine inventory
- Stock management
- Supplier management
- Medicine interactions

#### 10. **Dashboard & Analytics** (`dashboard`)
- Real-time metrics
- Revenue analytics
- Patient statistics
- Appointment trends
- Occupancy rates

## Database Schema Design

### Entity-Relationship Model

```
Users (1) ──────────── (1) Patient
         ├────────── (1) Doctor
         └────────── (1) Staff

Patient (1) ──────────── (N) Appointment
        ├────────── (N) MedicalRecord
        ├────────── (N) Prescription
        ├────────── (N) LabTest
        └────────── (N) Invoice

Doctor (1) ───────────── (N) Appointment
       └───────────── (N) Prescription

Appointment (N) ──── (1) Doctor
            └───── (1) Patient

Prescription (N) ──── (1) Doctor
            └───── (1) Patient

LabTest (N) ────────── (1) Patient

Invoice (N) ──────────── (1) Patient

AuditLog (N) ──── Any Entity (polymorphic)
```

### Key Tables

#### Users
```sql
CREATE TABLE users (
  id UUID PRIMARY KEY,
  userId VARCHAR(20) UNIQUE,
  email VARCHAR(255) UNIQUE,
  firstName VARCHAR(100),
  lastName VARCHAR(100),
  phoneNumber VARCHAR(20),
  password VARCHAR(255),
  roles ENUM[],
  status ENUM,
  emailVerified BOOLEAN,
  mfaEnabled BOOLEAN,
  lastLoginAt TIMESTAMP,
  createdAt TIMESTAMP,
  updatedAt TIMESTAMP,
  deletedAt TIMESTAMP
);
```

#### Patients
```sql
CREATE TABLE patients (
  id UUID PRIMARY KEY,
  userId UUID FOREIGN KEY,
  bloodType ENUM,
  allergies TEXT[],
  chronicDiseases TEXT[],
  insuranceProvider VARCHAR(100),
  insurancePolicyNumber VARCHAR(50),
  height FLOAT,
  weight FLOAT,
  createdAt TIMESTAMP,
  updatedAt TIMESTAMP
);
```

#### Appointments
```sql
CREATE TABLE appointments (
  id UUID PRIMARY KEY,
  patientId UUID FOREIGN KEY,
  doctorId UUID FOREIGN KEY,
  appointmentDate TIMESTAMP,
  status ENUM,
  reason TEXT,
  isVirtual BOOLEAN,
  meetingLink VARCHAR(500),
  createdAt TIMESTAMP,
  updatedAt TIMESTAMP
);
```

#### Prescriptions
```sql
CREATE TABLE prescriptions (
  id UUID PRIMARY KEY,
  patientId UUID FOREIGN KEY,
  doctorId UUID FOREIGN KEY,
  prescriptionNumber VARCHAR(50) UNIQUE,
  medicines JSONB,
  status ENUM,
  issuedDate TIMESTAMP,
  expiryDate TIMESTAMP,
  pdfUrl VARCHAR(500),
  createdAt TIMESTAMP
);
```

### Indexing Strategy

```
-- Performance Indexes
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_userId ON users(userId);
CREATE INDEX idx_patients_userId ON patients(userId);
CREATE INDEX idx_appointments_patientId ON appointments(patientId);
CREATE INDEX idx_appointments_doctorId ON appointments(doctorId);
CREATE INDEX idx_appointments_date ON appointments(appointmentDate);
CREATE INDEX idx_prescriptions_patientId ON prescriptions(patientId);
CREATE INDEX idx_audit_userId_action ON audit_logs(userId, action);
CREATE INDEX idx_audit_createdAt ON audit_logs(createdAt DESC);

-- Soft Delete Indexes
CREATE INDEX idx_users_deletedAt ON users(deletedAt) WHERE deletedAt IS NULL;
CREATE INDEX idx_patients_deletedAt ON patients(deletedAt) WHERE deletedAt IS NULL;
```

## Security Architecture

### Authentication Flow

```
1. User Login
   POST /api/auth/login
   └─> Validate credentials
       ├─> Hash password comparison
       ├─> Check user status
       └─> Generate JWT tokens

2. JWT Structure
   Header: {
     "alg": "HS256",
     "typ": "JWT"
   }
   Payload: {
     "sub": "user_id",
     "email": "user@email.com",
     "roles": ["doctor", "admin"],
     "iat": 1234567890,
     "exp": 1234571490
   }

3. Token Refresh
   POST /api/auth/refresh
   ├─> Validate refresh token signature
   ├─> Check token expiration
   ├─> Verify user status
   └─> Issue new access token
```

### RBAC (Role-Based Access Control)

```
Roles:
- ADMIN: Full system access
- DOCTOR: Patient management, prescriptions, appointments
- NURSE: Patient vitals, appointment support
- RECEPTIONIST: Appointment scheduling, patient intake
- PATIENT: Own medical records, appointment booking
- PHARMACIST: Prescription fulfillment
- LAB_TECHNICIAN: Lab test management
```

### Encryption Strategy

```
At Rest:
- Database: PostgreSQL native encryption
- S3 Files: AES-256 encryption
- Sensitive Fields: Encrypted using KMS

In Transit:
- TLS 1.2+ for all connections
- HTTPS enforced
- CORS properly configured
- CSRF protection enabled
```

## API Design Patterns

### RESTful Endpoints

```
Patients:
GET    /api/patients                    # List all
GET    /api/patients/:id                # Get one
POST   /api/patients                    # Create
PATCH  /api/patients/:id                # Update
DELETE /api/patients/:id                # Soft delete

Appointments:
GET    /api/appointments                # List
POST   /api/appointments                # Book
PATCH  /api/appointments/:id            # Reschedule
DELETE /api/appointments/:id            # Cancel

Prescriptions:
GET    /api/prescriptions               # List
POST   /api/prescriptions               # Create
GET    /api/prescriptions/:id/pdf       # Generate PDF
PATCH  /api/prescriptions/:id/sign      # Digital sign
```

### Response Format

```json
{
  "statusCode": 200,
  "data": {
    "id": "uuid",
    "name": "John Doe"
  },
  "message": "Success",
  "timestamp": "2024-02-22T10:30:00Z",
  "path": "/api/patients"
}
```

### Error Handling

```json
{
  "statusCode": 400,
  "message": "Invalid request",
  "errors": {
    "email": "Email is required"
  },
  "timestamp": "2024-02-22T10:30:00Z",
  "path": "/api/auth/register"
}
```

## File Upload & S3 Integration

### Secure Upload Flow

```
1. Client requests presigned URL
   POST /api/uploads/presigned-url
   └─> Backend generates S3 presigned URL (5 min expiry)

2. Client uploads directly to S3
   PUT https://bucket.s3.amazonaws.com/...
   └─> File encrypted with AES-256

3. Backend verifies upload
   POST /api/uploads/verify
   └─> Confirms file exists & is accessible

4. Generate access URLs
   GET /api/files/:fileId
   └─> Returns presigned download URL (1 hour expiry)
```

### File Organization in S3

```
healthcare-documents/
├── medical-records/
│   └── {patientId}/{recordId}/{filename}
├── prescriptions/
│   └── {patientId}/{prescriptionId}/
│       ├── prescription.pdf
│       └── signature.pdf
├── lab-reports/
│   └── {patientId}/{testId}/{filename}
├── invoices/
│   └── {patientId}/{invoiceId}/invoice.pdf
└── temp/
    └── {uploadId}/{filename}  # Expires after 24 hours
```

## Scalability Considerations

### Horizontal Scaling

```
1. Load Balancing
   - AWS ALB in front of API servers
   - Health check every 30 seconds
   - Automatic instance scaling based on CPU/memory

2. Database Scaling
   - Read replicas for read-heavy operations
   - Connection pooling (PgBouncer)
   - Query optimization & caching

3. Caching Layer
   - Redis for session storage
   - Cache medical records (30 min TTL)
   - Cache doctor availability (5 min TTL)
```

### Performance Optimization

```
1. Database Queries
   - Lazy loading with pagination
   - N+1 query prevention
   - Query result caching
   - Index optimization

2. API Response
   - Gzip compression
   - Response pagination (default 20, max 100)
   - Field filtering
   - Timestamp-based pagination for large datasets

3. Frontend
   - Code splitting
   - Image optimization
   - Service worker caching
   - CDN distribution via CloudFront
```

## Deployment Architecture

```
┌─────────────────────────────────────────┐
│         GitHub Actions (CI/CD)          │
│  - Run tests                            │
│  - Build Docker images                  │
│  - Push to ECR                          │
└──────────────┬──────────────────────────┘
               │
       ┌───────▼────────┐
       │  AWS ECR       │
       │  (Container    │
       │   Registry)    │
       └───────┬────────┘
               │
┌──────────────▼───────────────────────────┐
│     AWS ECS (Elastic Container Service) │
│  ┌─────────────┐  ┌──────────────┐     │
│  │  NestJS     │  │  NestJS      │     │
│  │  Container  │  │  Container   │     │
│  │  (instance) │  │  (instance)  │     │
│  └─────────────┘  └──────────────┘     │
└──────────────┬───────────────────────────┘
               │
       ┌───────▼───────────┐
       │  AWS RDS          │
       │  PostgreSQL       │
       │  Multi-AZ         │
       │  Automated Backup │
       └───────────────────┘
```

---

**Last Updated**: February 2026
