# Database Schema & Design

## PostgreSQL Schema

### Users Table
```sql
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  userId VARCHAR(20) UNIQUE NOT NULL,  -- DOC-000001, PAT-000001, etc.
  email VARCHAR(255) UNIQUE NOT NULL,
  firstName VARCHAR(100) NOT NULL,
  lastName VARCHAR(100) NOT NULL,
  phoneNumber VARCHAR(20),
  dateOfBirth DATE,
  gender VARCHAR(10), -- 'male', 'female', 'other'
  address VARCHAR(500),
  city VARCHAR(100),
  state VARCHAR(100),
  postalCode VARCHAR(20),
  country VARCHAR(100),
  password VARCHAR(255) NOT NULL,
  roles TEXT[] NOT NULL DEFAULT ARRAY['patient'], -- RBAC
  status VARCHAR(50) DEFAULT 'pending_verification',
  emailVerified BOOLEAN DEFAULT false,
  refreshToken TEXT,
  resetPasswordToken TEXT,
  resetPasswordExpires TIMESTAMP,
  mfaEnabled BOOLEAN DEFAULT false,
  mfaSecret TEXT,
  lastLoginAt TIMESTAMP,
  isDeleted BOOLEAN DEFAULT false,
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  deletedAt TIMESTAMP
);

CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_userId ON users(userId);
CREATE INDEX idx_users_status ON users(status);
CREATE INDEX idx_users_deletedAt ON users(deletedAt) WHERE deletedAt IS NULL;
```

### Patients Table
```sql
CREATE TABLE patients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  userId UUID NOT NULL UNIQUE,
  patientId VARCHAR(20),
  ssn VARCHAR(255), -- Encrypted
  bloodType VARCHAR(10), -- O+, O-, A+, A-, B+, B-, AB+, AB-
  allergies TEXT[] DEFAULT ARRAY[]::TEXT[],
  chronicDiseases TEXT[] DEFAULT ARRAY[]::TEXT[],
  insuranceProvider VARCHAR(100),
  insurancePolicyNumber VARCHAR(50),
  insuranceExpiry DATE,
  emergencyContactName VARCHAR(100),
  emergencyContactPhone VARCHAR(20),
  emergencyContactRelation VARCHAR(50),
  height FLOAT, -- in cm
  weight FLOAT, -- in kg
  maritalStatus VARCHAR(50),
  occupation VARCHAR(100),
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  deletedAt TIMESTAMP,
  FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX idx_patients_userId ON patients(userId);
CREATE INDEX idx_patients_bloodType ON patients(bloodType);
CREATE INDEX idx_patients_createdAt ON patients(createdAt);
```

### Doctors Table
```sql
CREATE TABLE doctors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  userId UUID NOT NULL UNIQUE,
  doctorId VARCHAR(20),
  specialization VARCHAR(100) NOT NULL,
  licenseNumber VARCHAR(50),
  licenseExpiry DATE,
  registrationNumber VARCHAR(50),
  qualifications TEXT[] DEFAULT ARRAY[]::TEXT[],
  certifications TEXT[] DEFAULT ARRAY[]::TEXT[],
  yearsOfExperience INTEGER,
  rating FLOAT DEFAULT 0,
  totalConsultations INTEGER DEFAULT 0,
  availableSlots JSONB DEFAULT '{}'::JSONB,
  consultationFee DECIMAL(10,2) DEFAULT 0,
  biography TEXT,
  profileImageUrl VARCHAR(500),
  isActive BOOLEAN DEFAULT true,
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  deletedAt TIMESTAMP,
  FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX idx_doctors_userId ON doctors(userId);
CREATE INDEX idx_doctors_specialization ON doctors(specialization);
CREATE INDEX idx_doctors_licenseNumber ON doctors(licenseNumber);
```

### Appointments Table
```sql
CREATE TABLE appointments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patientId UUID NOT NULL,
  doctorId UUID,
  appointmentDate TIMESTAMP NOT NULL,
  appointmentTime VARCHAR(5) NOT NULL, -- HH:MM format
  duration INTEGER, -- in minutes
  status VARCHAR(50) DEFAULT 'scheduled', -- scheduled, confirmed, completed, etc.
  reason TEXT,
  notes TEXT,
  diagnosis TEXT,
  treatment TEXT,
  isVirtual BOOLEAN DEFAULT false,
  meetingLink VARCHAR(500),
  reminderSent TIMESTAMP,
  cancelledReason TEXT,
  cancelledBy UUID,
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  deletedAt TIMESTAMP,
  FOREIGN KEY (patientId) REFERENCES patients(id) ON DELETE CASCADE,
  FOREIGN KEY (doctorId) REFERENCES doctors(id) ON DELETE SET NULL
);

CREATE INDEX idx_appointments_patientId ON appointments(patientId);
CREATE INDEX idx_appointments_doctorId ON appointments(doctorId);
CREATE INDEX idx_appointments_date ON appointments(appointmentDate);
CREATE INDEX idx_appointments_status ON appointments(status);
```

### Medical Records Table
```sql
CREATE TABLE medical_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patientId UUID NOT NULL,
  recordType VARCHAR(100) NOT NULL, -- consultation, diagnosis, test, surgery
  title VARCHAR(200) NOT NULL,
  description TEXT NOT NULL,
  findings TEXT,
  diagnosis TEXT,
  treatment TEXT,
  doctorName VARCHAR(100),
  doctorId UUID,
  attachmentUrls TEXT[] DEFAULT ARRAY[]::TEXT[], -- S3 URLs
  visitDate DATE,
  isConfidential BOOLEAN DEFAULT true,
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (patientId) REFERENCES patients(id) ON DELETE CASCADE
);

CREATE INDEX idx_medical_records_patientId ON medical_records(patientId);
CREATE INDEX idx_medical_records_recordType ON medical_records(recordType);
CREATE INDEX idx_medical_records_createdAt ON medical_records(createdAt);
```

### Prescriptions Table
```sql
CREATE TABLE prescriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patientId UUID NOT NULL,
  doctorId UUID,
  prescriptionNumber VARCHAR(50) UNIQUE NOT NULL,
  status VARCHAR(50) DEFAULT 'draft', -- draft, issued, active, fulfilled
  medicines JSONB NOT NULL, -- Array of medicine objects
  notes TEXT,
  diagnosis TEXT,
  issuedDate TIMESTAMP NOT NULL,
  expiryDate TIMESTAMP,
  isRecurring BOOLEAN DEFAULT false,
  recurringEndDate TIMESTAMP,
  isDigitallySigned BOOLEAN DEFAULT false,
  digitalSignatureUrl VARCHAR(500), -- S3 URL
  pdfUrl VARCHAR(500), -- S3 URL
  pharmacyNotified TEXT[] DEFAULT ARRAY[]::TEXT[],
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  deletedAt TIMESTAMP,
  FOREIGN KEY (patientId) REFERENCES patients(id) ON DELETE CASCADE,
  FOREIGN KEY (doctorId) REFERENCES doctors(id) ON DELETE SET NULL
);

CREATE INDEX idx_prescriptions_patientId ON prescriptions(patientId);
CREATE INDEX idx_prescriptions_doctorId ON prescriptions(doctorId);
CREATE INDEX idx_prescriptions_status ON prescriptions(status);
CREATE INDEX idx_prescriptions_issuedDate ON prescriptions(issuedDate);
```

### Invoices Table
```sql
CREATE TABLE invoices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patientId UUID NOT NULL,
  invoiceNumber VARCHAR(50) UNIQUE NOT NULL,
  lineItems JSONB NOT NULL, -- Array of line items
  subtotal DECIMAL(10,2) NOT NULL,
  discount DECIMAL(10,2) DEFAULT 0,
  taxAmount DECIMAL(10,2) DEFAULT 0,
  taxPercentage DECIMAL(5,2) DEFAULT 0,
  totalAmount DECIMAL(10,2) NOT NULL,
  paidAmount DECIMAL(10,2) DEFAULT 0,
  dueAmount DECIMAL(10,2) NOT NULL,
  status VARCHAR(50) DEFAULT 'draft',
  issueDate TIMESTAMP NOT NULL,
  dueDate TIMESTAMP NOT NULL,
  payments JSONB DEFAULT 'null'::JSONB, -- Array of payments
  notes TEXT,
  insuranceClaimId VARCHAR(100),
  pdfUrl VARCHAR(500), -- S3 URL
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  deletedAt TIMESTAMP,
  FOREIGN KEY (patientId) REFERENCES patients(id) ON DELETE CASCADE
);

CREATE INDEX idx_invoices_patientId ON invoices(patientId);
CREATE INDEX idx_invoices_invoiceNumber ON invoices(invoiceNumber);
CREATE INDEX idx_invoices_status ON invoices(status);
CREATE INDEX idx_invoices_dueDate ON invoices(dueDate);
```

### Lab Tests Table
```sql
CREATE TABLE lab_tests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patientId UUID NOT NULL,
  testName VARCHAR(200) NOT NULL,
  testCode VARCHAR(50),
  status VARCHAR(50) DEFAULT 'ordered',
  description TEXT NOT NULL,
  orderedBy VARCHAR(100),
  orderedDate TIMESTAMP NOT NULL,
  sampleCollectionDate TIMESTAMP,
  completionDate TIMESTAMP,
  testResults JSONB, -- Array of results
  interpretation TEXT,
  reportedBy VARCHAR(100),
  reportPdfUrl VARCHAR(500), -- S3 URL
  notes TEXT,
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  deletedAt TIMESTAMP,
  FOREIGN KEY (patientId) REFERENCES patients(id) ON DELETE CASCADE
);

CREATE INDEX idx_lab_tests_patientId ON lab_tests(patientId);
CREATE INDEX idx_lab_tests_status ON lab_tests(status);
CREATE INDEX idx_lab_tests_orderedDate ON lab_tests(orderedDate);
```

### Medicines Table
```sql
CREATE TABLE medicines (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  medicineCode VARCHAR(50) UNIQUE NOT NULL,
  name VARCHAR(200) NOT NULL,
  genericName VARCHAR(200),
  strength VARCHAR(50) NOT NULL, -- 500mg, 10ml
  formulation VARCHAR(50) NOT NULL, -- Tablet, Capsule, Syrup
  manufacturer VARCHAR(100),
  batchNumber VARCHAR(50),
  description TEXT,
  purchasePrice DECIMAL(10,2) NOT NULL,
  sellingPrice DECIMAL(10,2) NOT NULL,
  stock INTEGER DEFAULT 0,
  reorderLevel INTEGER DEFAULT 50,
  expiryDate TIMESTAMP,
  sideEffects TEXT[] DEFAULT ARRAY[]::TEXT[],
  contraindications TEXT[] DEFAULT ARRAY[]::TEXT[],
  storageConditions TEXT,
  isActive BOOLEAN DEFAULT true,
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  deletedAt TIMESTAMP
);

CREATE INDEX idx_medicines_medicineCode ON medicines(medicineCode);
CREATE INDEX idx_medicines_name ON medicines(name);
CREATE INDEX idx_medicines_stock ON medicines(stock);
```

### Audit Logs Table
```sql
CREATE TABLE audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  userId VARCHAR(50) NOT NULL,
  userEmail VARCHAR(255) NOT NULL,
  action VARCHAR(50) NOT NULL, -- CREATE, READ, UPDATE, DELETE, LOGIN
  entityType VARCHAR(100) NOT NULL,
  entityId UUID,
  changes JSONB, -- {old: {}, new: {}}
  ipAddress VARCHAR(45),
  userAgent TEXT,
  description TEXT,
  success BOOLEAN DEFAULT true,
  errorMessage TEXT,
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_audit_userId ON audit_logs(userId);
CREATE INDEX idx_audit_action ON audit_logs(action);
CREATE INDEX idx_audit_entityType ON audit_logs(entityType);
CREATE INDEX idx_audit_createdAt ON audit_logs(createdAt DESC);
CREATE INDEX idx_audit_ipAddress ON audit_logs(ipAddress);
```

## Migrations

### TypeORM Migration Example
```typescript
// src/database/migrations/1708600400000-CreateUsersTable.ts
import { MigrationInterface, QueryRunner, Table, Index } from 'typeorm';

export class CreateUsersTable1708600400000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: 'users',
        columns: [
          { name: 'id', type: 'uuid', isPrimary: true },
          { name: 'userId', type: 'varchar', length: '20', isUnique: true },
          { name: 'email', type: 'varchar', length: '255', isUnique: true },
          // ... other columns
        ],
      }),
    );

    await queryRunner.createIndex(
      'users',
      new Index({ columnNames: ['email'] }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable('users');
  }
}
```

## Data Retention Policy

```
Patient Records:
- Active patients: Indefinite (with updates)
- Inactive patients: 7 years after last visit
- Deleted patients: 7 years (for HIPAA compliance)

Audit Logs:
- All logs: 7 years minimum
- Access logs: 3 years
- Error logs: 1 year

Temporary Data:
- Failed uploads: 24 hours
- Session data: 7 days
- Cache: 1 hour TTL
```

## Backup Strategy

```
Automated Backups:
- Daily snapshots (24-hour retention)
- Weekly snapshots (4-week retention)
- Monthly snapshots (12-month retention)
- Disaster recovery: Cross-region replication

Restore Testing:
- Monthly full restore test
- Quarterly cross-region restore test
- Annual disaster recovery simulation

Retention:
- RTO (Recovery Time Objective): 1 hour
- RPO (Recovery Point Objective): 15 minutes
```

---

**Last Updated**: February 2026
