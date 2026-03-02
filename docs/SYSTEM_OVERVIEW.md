# System Architecture & Technical Overview

## Executive Summary

The Healthcare Management System (HMS) is a production-ready, enterprise-grade hospital and clinic management platform designed with modern technologies, security best practices, and HIPAA compliance. It provides comprehensive functionality for patient management, appointment scheduling, doctor coordination, prescription management, billing, laboratory tests, and analytics.

## Technology Stack

### Frontend
- **Framework**: Next.js 14 (React 18, TypeScript)
- **Styling**: Tailwind CSS 3 with custom components
- **State Management**: Zustand
- **Form Handling**: React Hook Form + Zod validation
- **HTTP Client**: Axios with interceptors
- **UI Components**: Lucide React, Recharts, React Calendar
- **Features**: Server-side rendering, static generation, incremental builds

### Backend
- **Framework**: NestJS 10 (Node.js ecosystem)
- **Database**: PostgreSQL 14+ (ACID-compliant, encrypted)
- **Authentication**: JWT (JSON Web Tokens) + Passport.js
- **ORM**: TypeORM with migrations
- **File Storage**: AWS S3 with encryption
- **Caching**: Redis (optional, for sessions & cache)
- **API Docs**: Swagger/OpenAPI 3.0

### Infrastructure
- **Hosting**: AWS (ECS, RDS, S3, CloudFront)
- **Containerization**: Docker & Docker Compose
- **CI/CD**: GitHub Actions
- **Monitoring**: CloudWatch + DataDog (optional)
- **Security**: SSL/TLS, WAF, security groups

## System Components

### 1. Frontend (Next.js Application)

**Purpose**: User-facing interface for all system users

**Features**:
- Responsive design (mobile, tablet, desktop)
- Real-time data updates
- Offline capability (PWA)
- Multi-role dashboards
- Dark mode support (future)
- Accessibility (WCAG 2.1 AA)

**Key Pages**:
- `/auth/login` - User authentication
- `/auth/register` - User registration
- `/dashboard` - Role-specific dashboards
- `/patients` - Patient management portal
- `/appointments` - Appointment booking/management
- `/prescriptions` - Prescription view
- `/doctors` - Doctor directory
- `/billing` - Invoice & payment tracking
- `/laboratory` - Lab test results

### 2. Backend API (NestJS Application)

**Purpose**: Core business logic, data processing, and external integrations

**Modules**:
1. **Auth Module**: Authentication, authorization, MFA
2. **Users Module**: User management, roles, permissions
3. **Patients Module**: Patient data, medical records (EMR/EHR)
4. **Doctors Module**: Doctor profiles, availability, specializations
5. **Appointments Module**: Scheduling, conflict detection, reminders
6. **Prescriptions Module**: E-prescription, PDF generation, digital signature
7. **Billing Module**: Invoicing, payment tracking, tax calculation
8. **Laboratory Module**: Test ordering, result management, reports
9. **Pharmacy Module**: Medicine inventory, stock tracking
10. **Dashboard Module**: Analytics, reporting, metrics

**Common Services**:
- **AuthService**: Token management, security
- **S3Service**: File upload/download with encryption
- **AuditService**: Activity logging & compliance tracking
- **EmailService**: Notifications & communications
- **PDFService**: Document generation

### 3. Database (PostgreSQL)

**Purpose**: Persistent data storage with ACID compliance and encryption

**Tables**:
- Users (authentication & roles)
- Patients (demographics & medical history)
- Doctors (profiles & availability)
- Appointments (scheduling)
- Prescriptions (e-prescriptions)
- MedicalRecords (EMR/EHR)
- Invoices (billing)
- LabTests (test management)
- Medicines (pharmacy)
- AuditLogs (compliance tracking)

**Features**:
- Row-level security (RLS)
- Soft deletes (audit trail)
- Encrypted sensitive fields
- Comprehensive indexing
- Automated backups
- Point-in-time recovery

### 4. File Storage (AWS S3)

**Purpose**: Secure storage for medical documents and files

**Buckets**:
- Medical records (EMR/EHR documents)
- Prescriptions (PDF with digital signatures)
- Lab reports
- Invoices
- Patient uploads
- Temporary files (auto-expire)

**Security**:
- AES-256 encryption
- Version control
- Access logging
- Presigned URLs (temporary access)
- Lifecycle policies

### 5. Cache Layer (Redis)

**Purpose**: Performance optimization and session management

**Uses**:
- User session storage
- API response caching
- Rate limiting counters
- Real-time notifications
- Queue for async tasks (future)

### 6. Monitoring & Logging

**Tools**:
- **CloudWatch**: AWS native logs & metrics
- **DataDog**: Application performance monitoring (optional)
- **ELK Stack**: Centralized logging (optional)

**Metrics Tracked**:
- API response times
- Database query performance
- Error rates & exceptions
- User activities & audit trail
- System resource usage (CPU, memory)
- Authentication attempts

## Data Flow Diagrams

### User Authentication Flow

```
┌─────────────┐
│   Client    │
└──────┬──────┘
       │ 1. POST /auth/register
       ├─ email, password, firstName, lastName
       │
       ▼
┌──────────────────────────────────────┐
│  Backend - Auth Controller           │
│  ├─ Validate input (DTOs)            │
│  ├─ Check email uniqueness           │
│  ├─ Hash password (bcrypt)           │
│  └─ Create user record               │
└──────┬─────────────────────────────────┘
       │ 2. Store in database
       ▼
┌──────────────────────────────────────┐
│  PostgreSQL                          │
│  INSERT INTO users (...)             │
└──────┬─────────────────────────────────┘
       │ 3. Return success
       ▼
┌─────────────┐
│   Client    │ ← 201 Created + userId
└─────────────┘

---

Login Flow:
┌─────────────┐
│   Client    │
└──────┬──────┘
       │ 1. POST /auth/login
       │ email, password
       │
       ▼
┌──────────────────────────────────────┐
│  Backend - Auth Service              │
│  ├─ Query user by email              │
│  ├─ Compare password (bcrypt)        │
│  ├─ Validate user status             │
│  └─ Generate JWT tokens              │
└──────┬─────────────────────────────────┘
       │ 2. Tokens generated
       ├─ Access Token (24h)
       └─ Refresh Token (7d)
       │
       ▼
┌─────────────┐
│   Client    │ ← 200 OK + tokens
│ localStorage│ ← Store tokens
└─────────────┘

---

Request Flow (with auth):
┌─────────────┐
│   Client    │
│ +Auth Token │
└──────┬──────┘
       │ GET /api/patients
       │ Authorization: Bearer <token>
       │
       ▼
┌──────────────────────────────────────┐
│  JWT Auth Guard                      │
│  ├─ Extract token from header        │
│  ├─ Verify signature                 │
│  ├─ Check expiration                 │
│  └─ Validate user status             │
└──────┬─────────────────────────────────┘
       │ (If valid)
       ▼
┌──────────────────────────────────────┐
│  Roles Guard (RBAC)                  │
│  ├─ Check required roles             │
│  └─ Verify permissions               │
└──────┬─────────────────────────────────┘
       │ (If authorized)
       ▼
┌──────────────────────────────────────┐
│  Patient Controller                  │
│  └─ Call service to fetch data       │
└──────┬─────────────────────────────────┘
       │
       ▼
┌──────────────────────────────────────┐
│  Patient Service                     │
│  └─ Query database                   │
└──────┬─────────────────────────────────┘
       │
       ▼
┌──────────────────────────────────────┐
│  PostgreSQL                          │
│  SELECT * FROM patients WHERE ...    │
└──────┬─────────────────────────────────┘
       │
       ▼
┌─────────────┐
│   Client    │ ← 200 OK + patient data
└─────────────┘
```

### Appointment Booking Flow

```
┌──────────┐
│  Patient │ (via Frontend)
└─────┬────┘
      │ 1. View doctor availability
      │ GET /api/doctors/:id/available-slots
      │
      ▼
┌──────────────────────────────────┐
│  Doctor Controller               │
│  └─ Fetch doctor availability    │
└─────┬────────────────────────────┘
      │
      ▼
┌──────────────────────────────────┐
│  Doctor Service                  │
│  └─ Get available slots          │
└─────┬────────────────────────────┘
      │ 2. Data returned
      │ Display to patient
      │
      ▼
┌──────────┐
│  Patient │
│  Selects │
│   slot   │
└─────┬────┘
      │ 3. POST /api/appointments
      │ {patientId, doctorId, date, time}
      │
      ▼
┌──────────────────────────────────┐
│  Appointment Controller          │
│  ├─ Validate input              │
│  └─ Call service to book         │
└─────┬────────────────────────────┘
      │
      ▼
┌──────────────────────────────────┐
│  Appointment Service             │
│  ├─ Check for conflicts          │
│  ├─ Verify doctor availability   │
│  ├─ Create appointment record    │
│  ├─ Queue email reminder         │
│  └─ Update doctor availability   │
└─────┬────────────────────────────┘
      │
      ▼
┌──────────────────────────────────┐
│  PostgreSQL                      │
│  INSERT INTO appointments (...)  │
│  UPDATE doctor availability      │
└─────┬────────────────────────────┘
      │
      ▼
┌──────────────────────────────────┐
│  Email Service                   │
│  └─ Send confirmation email      │
└──────────────────────────────────┘
      │
      ▼
┌──────────┐
│  Patient │ ← 201 Created + confirmation
└──────────┘
```

## Security Architecture

### Encryption Layers

```
┌─────────────────────────────────────────────────┐
│  Layer 1: Data in Transit                       │
│  ├─ HTTPS/TLS 1.2+ (all connections)            │
│  ├─ JWT signed tokens (RS256/HS256)             │
│  └─ Secure cookies (HttpOnly, Secure flags)     │
└─────────────────────────────────────────────────┘
                      ▼
┌─────────────────────────────────────────────────┐
│  Layer 2: API Gateway                           │
│  ├─ WAF (Web Application Firewall)              │
│  ├─ Rate limiting                               │
│  ├─ CORS validation                             │
│  └─ Request signing                             │
└─────────────────────────────────────────────────┘
                      ▼
┌─────────────────────────────────────────────────┐
│  Layer 3: Application Layer                     │
│  ├─ JWT verification (passport)                 │
│  ├─ Role-based access control (RBAC)            │
│  ├─ Input validation (class-validator)          │
│  └─ Output sanitization                         │
└─────────────────────────────────────────────────┘
                      ▼
┌─────────────────────────────────────────────────┐
│  Layer 4: Database Layer                        │
│  ├─ Row-level security (RLS) policies           │
│  ├─ Parameterized queries (SQL injection proof) │
│  ├─ Column encryption (PII fields)              │
│  └─ Audit trail (immutable logs)                │
└─────────────────────────────────────────────────┘
                      ▼
┌─────────────────────────────────────────────────┐
│  Layer 5: Storage Layer                         │
│  ├─ AES-256 encryption at rest                  │
│  ├─ S3 server-side encryption                   │
│  ├─ Encrypted backups                           │
│  └─ KMS key rotation                            │
└─────────────────────────────────────────────────┘
```

## Scalability Strategy

### Horizontal Scaling

```
Load Balancer (AWS ALB)
        │
    ┌───┼───┬───┐
    │   │   │   │
  ┌─▼─┬─▼─┬─▼─┬─▼─┐
  │EC2│EC2│EC2│EC2│ (Auto-scaling group)
  │API│API│API│API│ Min: 2, Max: 10, Target CPU: 70%
  └─┬─┴─┬─┴─┬─┴─┬─┘
    │   │   │   │
    └───┴───┴───┘
        │
        ▼
  PostgreSQL RDS
  ├─ Primary (write)
  ├─ Read replicas
  └─ Automated backups
```

### Caching Strategy

```
CDN (CloudFront) for frontend
        │
    Cache Layers
    ├─ API response cache (Redis, 5 min)
    ├─ Database query cache (Redis, 30 min)
    └─ Session storage (Redis)
```

## Performance Optimization

### Database Optimization
- Connection pooling (PgBouncer)
- Query result caching
- Lazy loading with pagination
- N+1 query prevention
- Comprehensive indexing
- Regular ANALYZE & VACUUM

### API Optimization
- Gzip response compression
- API field filtering
- Pagination (default 20, max 100)
- Timestamp-based pagination for large datasets
- Rate limiting

### Frontend Optimization
- Code splitting
- Image optimization
- Service worker caching
- Static generation where possible
- Next.js image optimization

## Future Enhancement & AI Features

### Planned Features

1. **Symptom Checker (AI)**
   - NLP-based symptom analysis
   - Preliminary diagnosis suggestions
   - Doctor referral recommendations

2. **Predictive Analytics**
   - Patient risk scoring
   - Disease progression prediction
   - Hospital resource forecasting

3. **Medical Image Analysis**
   - Computer vision for X-rays/CT scans
   - Anomaly detection
   - Automated report generation

4. **Clinical Decision Support**
   - Drug interaction checking
   - Evidence-based treatment suggestions
   - Clinical guideline compliance

5. **Natural Language Processing**
   - Clinical note analysis
   - Medical coding automation
   - Speech-to-text for consultations

6. **Telemedicine Enhancements**
   - Video consultation (WebRTC)
   - Screen sharing for medical records
   - Prescription integration

7. **Mobile Application**
   - Native iOS/Android apps
   - Offline medical record access
   - Push notifications
   - Biometric authentication

---

**Last Updated**: February 2026
**Version**: 1.0.0
**Status**: Production-Ready
