# HIPAA Compliance & Security Guide

## HIPAA Overview

**HIPAA** (Health Insurance Portability and Accountability Act) is a U.S. federal law that establishes national standards for protecting patient privacy and security of health information.

## Compliance Requirements

### 1. Privacy Rule
Protects the privacy of individually identifiable health information (PHI - Protected Health Information).

#### What is PHI?
- Patient name, ID numbers
- Medical history and conditions
- Lab results and imaging reports
- Appointment details
- Insurance information
- Any health data linked to a patient

#### Our Implementation
```
✅ Access Controls
- Role-based access control (RBAC)
- Only authorized staff access patient data
- Principle of least privilege
- Activity logging for all data access

✅ Minimum Necessary Data
- Only collect required information
- Don't request unnecessary data
- Regular data purging (soft deletes with retention)

✅ Patient Rights
- Allow patient access to own records
- Support data portability
- Amendment and correction capabilities
- Accounting of disclosures
```

### 2. Security Rule
Technical and organizational safeguards for PHI protection.

#### Administrative Safeguards
```
Access Management:
- User authentication with MFA
- Role-based permissions
- Regular access reviews
- Termination procedures

Security Awareness:
- Staff training on HIPAA
- Security policies & procedures
- Incident response plan
- Business continuity planning
```

#### Physical Safeguards
```
Server Security:
- Data center in secure AWS facilities
- Restricted physical access
- Monitoring and surveillance
- Disaster recovery measures
```

#### Technical Safeguards
```
Encryption:
- AES-256 encryption at rest
- TLS 1.2+ for data in transit
- SSL/TLS for all communications
- Encrypted database backups

Access Controls:
- JWT-based authentication
- Session management with expiration
- IP whitelisting for admin access
- API key rotation policies

Audit & Accountability:
- Immutable audit logs
- Comprehensive logging
- Tamper detection
- Log retention (7 years)

Data Integrity:
- Checksums for critical data
- Backup verification
- Version control
- Change tracking
```

### 3. Breach Notification Rule
Requirements for notifying individuals of data breaches.

#### Implementation
```
Breach Detection:
- Automated intrusion detection
- Log analysis and alerts
- Regular security audits
- Penetration testing

Notification Process:
- Assess breach extent
- Notify affected individuals
- Document breach details
- Report to HHS if 500+ individuals
- Timeline: Without unreasonable delay (typically 60 days)

Documentation:
- Nature of breach
- Data elements involved
- Affected individuals
- Remediation measures
- Prevention steps
```

## Our Security Implementation

### Authentication & Authorization

```typescript
// JWT with secure refresh tokens
{
  "accessToken": "expires in 24h",
  "refreshToken": "expires in 7d",
  "tokenType": "Bearer"
}

// Role-based access control
roles: [
  'ADMIN',      // Full system access
  'DOCTOR',     // Patient management, prescriptions
  'NURSE',      // Vital signs, patient support
  'RECEPTIONIST', // Appointment scheduling
  'PATIENT',    // Own records only
  'PHARMACIST', // Prescription fulfillment
  'LAB_TECHNICIAN' // Lab test management
]
```

### Data Encryption

```
At Rest:
├─ Database: PostgreSQL native encryption
├─ Files: AWS S3 with AES-256
├─ Backups: Encrypted snapshots
└─ Secrets: AWS Secrets Manager (encrypted)

In Transit:
├─ HTTPS (TLS 1.2+)
├─ API: JWT signed tokens
├─ Database: SSL/TLS connections
└─ All external APIs: Encrypted channels
```

### Audit Logging

```typescript
// Every action logged immutably
{
  "id": "uuid",
  "userId": "doctor-001",
  "userEmail": "doctor@hospital.com",
  "action": "READ",
  "entityType": "PATIENT",
  "entityId": "patient-123",
  "changes": {
    "old": { ... },
    "new": { ... }
  },
  "ipAddress": "192.168.1.1",
  "userAgent": "Mozilla/5.0...",
  "success": true,
  "createdAt": "2024-02-22T10:30:00Z"
}

// Retention: 7 years minimum
// Access: Only authorized personnel
// Integrity: Immutable records
```

### Database Security

```sql
-- Column-level encryption for sensitive data
CREATE TABLE patients (
  id UUID PRIMARY KEY,
  -- Encrypted columns
  ssn bytea, -- Encrypted using pgcrypto
  
  -- PII encryption
  firstName VARCHAR ENCRYPTED,
  lastName VARCHAR ENCRYPTED,
  phoneNumber VARCHAR ENCRYPTED,
  
  -- Soft delete for audit trail
  deletedAt TIMESTAMP,
  
  createdAt TIMESTAMP,
  updatedAt TIMESTAMP
);

-- Row-level security
ALTER TABLE patients ENABLE ROW LEVEL SECURITY;

CREATE POLICY patient_access_policy ON patients
  USING (
    -- Patients see only their own records
    user_id = current_user_id
    OR
    -- Doctors see their patients
    doctor_id IN (SELECT doctor_id FROM patient_assignments WHERE doctor_id = current_user_id)
    OR
    -- Admins see everything
    current_user_role = 'admin'
  );
```

### File Upload Security

```
Upload Flow:
1. Client requests presigned URL (expires in 5 minutes)
2. Client uploads directly to S3 (bypasses backend)
3. S3 encrypts file (AES-256) automatically
4. Backend verifies file exists
5. File stored in patient-specific folder
6. Access via presigned URLs (1-hour expiry)

Validation:
✅ File size limits (max 10MB)
✅ File type whitelist (PDF, images only)
✅ Virus scanning via ClamAV
✅ No direct public access
✅ Automatic expiration after 90 days
```

### Password Security

```typescript
// Hashing
- Algorithm: bcrypt
- Salt rounds: 10
- Cost factor: $2b$10$

// Requirements
- Minimum 12 characters
- Must include: uppercase, lowercase, number, special char
- No username in password
- Password history (last 5 passwords)
- Expiration: 90 days
- Reset: Secure token expires in 1 hour

// Transmission
- HTTPS only
- No logging of passwords
- No password hints or recovery questions
```

### API Security

```
Authentication:
✅ JWT Bearer tokens
✅ Token refresh mechanism
✅ Rate limiting (100 req/min per user)
✅ CORS properly configured

Headers Required:
- Authorization: Bearer {token}
- Content-Type: application/json
- User-Agent: Client identification

Security Headers:
- X-Content-Type-Options: nosniff
- X-Frame-Options: DENY
- X-XSS-Protection: 1; mode=block
- Content-Security-Policy: strict
- Strict-Transport-Security: max-age=31536000
```

### Data De-identification

For research & analytics, we implement HIPAA de-identification standards:

```
Remove/Hash:
- Patient name
- Medical record numbers
- Social Security numbers
- Dates (shift by random offset)
- Telephone numbers
- Email addresses
- IP addresses
- Account numbers

Keep:
- Age / Birth year
- Gender
- Admission/discharge dates (shifted)
- Diagnosis codes
- Treatment information (without identifiers)
```

## Business Associate Agreements (BAA)

All third-party vendors must sign a BAA covering:

```
Vendors Covered:
✅ AWS (cloud hosting)
✅ Stripe/Razorpay (payments)
✅ SendGrid (email)
✅ DataDog (monitoring)
✅ GitHub (version control)

BAA Requirements:
- Use PHI only for contracted purposes
- Implement safeguards (HIPAA-level)
- Report breaches within 24 hours
- Ensure subcontractors comply
- Delete/return PHI at contract end
- Audit rights for covered entities
```

## Incident Response Plan

### Breach Detection & Response

```
Phase 1: Detection (0-24 hours)
├─ Automated alerts
├─ Investigation team activated
├─ Document findings
├─ Assess scope & severity

Phase 2: Containment (24-72 hours)
├─ Isolate affected systems
├─ Prevent further access
├─ Preserve evidence
├─ Deploy patches/fixes

Phase 3: Eradication (72-168 hours)
├─ Remove malicious code
├─ Close security gaps
├─ Verify system integrity
├─ Restore from clean backups

Phase 4: Notification (Without unreasonable delay)
├─ Notify affected individuals
├─ Notify credit bureaus (if 500+)
├─ Notify HHS OCR (if 500+)
├─ Notify media (if state-mandated)
├─ Document all notifications

Phase 5: Recovery
├─ Restore services
├─ Monitor for re-occurrence
├─ Conduct post-incident review
├─ Implement preventive measures

Post-Incident:
- Root cause analysis
- Process improvements
- Staff training updates
- Security enhancements
- Legal review and guidance
```

## Compliance Checklist

```
✅ Privacy Policy - Published & accessible
✅ Security Policy - Documented & enforced
✅ Incident Response Plan - Tested regularly
✅ Disaster Recovery Plan - Tested annually
✅ Business Continuity Plan - Documented
✅ Data Retention Policy - Implemented
✅ Authorization Agreements - All staff sign
✅ Business Associate Agreements - All vendors sign
✅ Training Documentation - Annual updates
✅ Audit Logs - 7-year retention
✅ Access Controls - Role-based, tested
✅ Encryption - AES-256 at rest & in transit
✅ Vulnerability Scanning - Monthly
✅ Penetration Testing - Quarterly
✅ Security Updates - Deployed within 30 days
✅ Backup Testing - Monthly verification
✅ Monitoring & Logging - Real-time
```

## Auditing & Testing

### Regular Security Tests

```
Monthly:
- Vulnerability scanning
- Log review & analysis
- Access control verification
- Database integrity checks

Quarterly:
- Penetration testing
- Code security review
- Backup restoration testing
- Network security audit

Annually:
- Full security assessment
- Business continuity test
- Disaster recovery drill
- Staff training refresh
- Third-party vendor audit
```

### Monitoring

```
Real-time Alerts:
- Failed authentication attempts
- Unauthorized data access
- Large data exports
- API rate limit exceeded
- Certificate expiration warnings
- Database connection errors
- Backup failures

Continuous Monitoring:
- CloudWatch logs analysis
- DataDog application monitoring
- AWS GuardDuty threat detection
- WAF rule violations
- Database activity monitoring
```

## Deployment Checklist

```
Before Production:
✅ All tests passing
✅ Security scan passed
✅ HIPAA controls verified
✅ Encryption enabled
✅ Audit logging active
✅ Backup verified
✅ Disaster recovery tested
✅ Team trained
✅ Documentation complete
✅ Legal review approved
```

## References

- [HIPAA Official Rules](https://www.hhs.gov/hipaa/)
- [HIPAA Security Rule](https://www.hhs.gov/hipaa/for-professionals/security/)
- [HIPAA Privacy Rule](https://www.hhs.gov/hipaa/for-professionals/privacy/)
- [Breach Notification Rule](https://www.hhs.gov/hipaa/for-professionals/breach-notification/)
- [OWASP Security Guidelines](https://owasp.org/www-project-web-security-testing-guide/)
- [NIST Cybersecurity Framework](https://www.nist.gov/cyberframework/)

---

**Last Updated**: February 2026
**Compliance Level**: HIPAA-Ready (Requires Business Associate Agreements)
