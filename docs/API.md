# REST API Documentation

## Base URL

```
Development: http://localhost:3001/api
Production: https://api.healthcare.com/api
```

## Authentication

All endpoints (except `/auth/login` and `/auth/register`) require a valid JWT token in the Authorization header:

```
Authorization: Bearer <access_token>
```

## API Endpoints

### Authentication

#### Register User
```
POST /auth/register
Content-Type: application/json

Request:
{
  "email": "doctor@example.com",
  "firstName": "John",
  "lastName": "Doe",
  "password": "SecurePassword123",
  "role": "doctor"  // "patient", "doctor", "nurse", "receptionist", "pharmacist", "lab_technician"
}

Response: 201
{
  "message": "User registered successfully",
  "userId": "uuid-123456"
}
```

#### Login
```
POST /auth/login
Content-Type: application/json

Request:
{
  "email": "doctor@example.com",
  "password": "SecurePassword123"
}

Response: 200
{
  "accessToken": "eyJhbGc...",
  "refreshToken": "eyJhbGc...",
  "user": {
    "id": "uuid-123456",
    "userId": "DOC-000001",
    "email": "doctor@example.com",
    "firstName": "John",
    "lastName": "Doe",
    "roles": ["doctor"]
  }
}
```

#### Refresh Token
```
POST /auth/refresh
Content-Type: application/json

Request:
{
  "refreshToken": "eyJhbGc..."
}

Response: 200
{
  "accessToken": "eyJhbGc...",
  "refreshToken": "eyJhbGc..."
}
```

#### Get Profile
```
GET /auth/profile
Authorization: Bearer <access_token>

Response: 200
{
  "id": "uuid-123456",
  "userId": "DOC-000001",
  "email": "doctor@example.com",
  "firstName": "John",
  "lastName": "Doe",
  "phoneNumber": "+1234567890",
  "roles": ["doctor"],
  "status": "active",
  "createdAt": "2024-02-22T10:30:00Z"
}
```

#### Logout
```
POST /auth/logout
Authorization: Bearer <access_token>

Response: 200
{
  "message": "Logged out successfully"
}
```

---

### Patients

#### List Patients
```
GET /patients?page=1&limit=20&search=john
Authorization: Bearer <access_token>

Response: 200
{
  "data": [
    {
      "id": "uuid-patient-1",
      "userId": "PAT-000001",
      "user": {
        "firstName": "Jane",
        "lastName": "Smith",
        "email": "jane@example.com"
      },
      "bloodType": "O+",
      "allergies": ["Penicillin"],
      "chronicDiseases": ["Diabetes"],
      "height": 165,
      "weight": 65,
      "createdAt": "2024-02-22T10:30:00Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 150
  }
}
```

#### Get Patient Details
```
GET /patients/:patientId
Authorization: Bearer <access_token>

Response: 200
{
  "id": "uuid-patient-1",
  "userId": "PAT-000001",
  "user": { ... },
  "bloodType": "O+",
  "allergies": ["Penicillin"],
  "medicalRecords": [ ... ],
  "appointments": [ ... ],
  "prescriptions": [ ... ],
  "invoices": [ ... ]
}
```

#### Create Patient
```
POST /patients
Authorization: Bearer <access_token>
Content-Type: application/json

Request:
{
  "userId": "uuid-user",
  "bloodType": "O+",
  "allergies": ["Penicillin", "Sulfa"],
  "chronicDiseases": ["Diabetes", "Hypertension"],
  "height": 165,
  "weight": 65,
  "insuranceProvider": "Aetna",
  "insurancePolicyNumber": "AET123456"
}

Response: 201
{ ... patient data ... }
```

#### Update Patient
```
PATCH /patients/:patientId
Authorization: Bearer <access_token>
Content-Type: application/json

Request:
{
  "weight": 70,
  "allergies": ["Penicillin", "Sulfa", "Latex"]
}

Response: 200
{ ... updated patient data ... }
```

#### Delete Patient
```
DELETE /patients/:patientId
Authorization: Bearer <access_token>

Response: 200
{
  "message": "Patient deleted successfully"
}
```

---

### Medical Records

#### List Medical Records
```
GET /patients/:patientId/medical-records?type=consultation
Authorization: Bearer <access_token>

Response: 200
{
  "data": [
    {
      "id": "uuid-record-1",
      "recordType": "consultation",
      "title": "Annual Checkup",
      "description": "Regular health checkup",
      "findings": "Patient is in good health",
      "diagnosis": "Mild hypertension",
      "treatment": "Prescribed lisinopril 10mg daily",
      "doctorName": "Dr. John Smith",
      "visitDate": "2024-02-22",
      "createdAt": "2024-02-22T10:30:00Z"
    }
  ]
}
```

#### Create Medical Record
```
POST /patients/:patientId/medical-records
Authorization: Bearer <access_token>
Content-Type: application/json

Request:
{
  "recordType": "consultation",
  "title": "Follow-up Visit",
  "description": "Post-surgery follow-up",
  "findings": "Incision healing well",
  "diagnosis": "Surgical recovery on track",
  "treatment": "Continue current medications"
}

Response: 201
{ ... record data ... }
```

---

### Appointments

#### List Appointments
```
GET /appointments?status=scheduled&patientId=uuid&doctorId=uuid
Authorization: Bearer <access_token>

Response: 200
{
  "data": [
    {
      "id": "uuid-apt-1",
      "patient": { "firstName": "Jane", "lastName": "Smith" },
      "doctor": { "firstName": "John", "lastName": "Doe" },
      "appointmentDate": "2024-03-15",
      "appointmentTime": "14:00",
      "status": "scheduled",
      "reason": "General checkup",
      "isVirtual": false,
      "createdAt": "2024-02-22T10:30:00Z"
    }
  ]
}
```

#### Book Appointment
```
POST /appointments
Authorization: Bearer <access_token>
Content-Type: application/json

Request:
{
  "patientId": "uuid-patient",
  "doctorId": "uuid-doctor",
  "appointmentDate": "2024-03-15",
  "appointmentTime": "14:00",
  "reason": "Routine checkup",
  "isVirtual": false
}

Response: 201
{ ... appointment data ... }
```

#### Reschedule Appointment
```
PATCH /appointments/:appointmentId
Authorization: Bearer <access_token>
Content-Type: application/json

Request:
{
  "appointmentDate": "2024-03-16",
  "appointmentTime": "10:00"
}

Response: 200
{ ... updated appointment data ... }
```

#### Cancel Appointment
```
DELETE /appointments/:appointmentId
Authorization: Bearer <access_token>
Content-Type: application/json

Request:
{
  "cancelledReason": "Patient cannot attend"
}

Response: 200
{
  "message": "Appointment cancelled successfully"
}
```

#### Get Available Slots
```
GET /appointments/doctor/:doctorId/available-slots?date=2024-03-15
Authorization: Bearer <access_token>

Response: 200
{
  "availableSlots": [
    { "time": "09:00", "available": true },
    { "time": "10:00", "available": false },
    { "time": "11:00", "available": true }
  ]
}
```

---

### Prescriptions

#### List Prescriptions
```
GET /prescriptions?patientId=uuid&status=active
Authorization: Bearer <access_token>

Response: 200
{
  "data": [
    {
      "id": "uuid-rx-1",
      "prescriptionNumber": "RX-202400001",
      "patient": { "firstName": "Jane", "lastName": "Smith" },
      "doctor": { "firstName": "John", "lastName": "Doe" },
      "medicines": [
        {
          "medicineName": "Aspirin",
          "dosage": "500mg",
          "frequency": "Twice daily",
          "duration": "10 days",
          "quantity": 20
        }
      ],
      "status": "active",
      "issuedDate": "2024-02-22",
      "expiryDate": "2024-05-22",
      "pdfUrl": "https://s3.amazonaws.com/...",
      "createdAt": "2024-02-22T10:30:00Z"
    }
  ]
}
```

#### Create Prescription
```
POST /prescriptions
Authorization: Bearer <access_token> (Doctor only)
Content-Type: application/json

Request:
{
  "patientId": "uuid-patient",
  "medicines": [
    {
      "medicineId": "uuid-med-1",
      "medicineName": "Lisinopril",
      "dosage": "10mg",
      "frequency": "Once daily",
      "duration": "30 days",
      "instructions": "Take in the morning",
      "quantity": 30
    }
  ],
  "diagnosis": "Hypertension",
  "notes": "Monitor blood pressure daily"
}

Response: 201
{ ... prescription data ... }
```

#### Generate Prescription PDF
```
GET /prescriptions/:prescriptionId/pdf
Authorization: Bearer <access_token>

Response: 200 (application/pdf)
[PDF file stream]
```

#### Digitally Sign Prescription
```
PATCH /prescriptions/:prescriptionId/sign
Authorization: Bearer <access_token> (Doctor only)
Content-Type: application/json

Request:
{
  "signature": "base64-encoded-signature"
}

Response: 200
{ ... prescription with digital signature ... }
```

---

### Billing & Invoices

#### List Invoices
```
GET /billing/invoices?patientId=uuid&status=paid
Authorization: Bearer <access_token>

Response: 200
{
  "data": [
    {
      "id": "uuid-inv-1",
      "invoiceNumber": "INV-202400001",
      "patient": { "firstName": "Jane", "lastName": "Smith" },
      "lineItems": [
        {
          "description": "Consultation Fee",
          "quantity": 1,
          "unitPrice": 100,
          "category": "consultation"
        }
      ],
      "subtotal": 100,
      "taxAmount": 8,
      "totalAmount": 108,
      "paidAmount": 108,
      "status": "paid",
      "issueDate": "2024-02-22",
      "dueDate": "2024-03-22",
      "payments": [
        {
          "amount": 108,
          "method": "card",
          "paymentDate": "2024-02-22"
        }
      ]
    }
  ]
}
```

#### Create Invoice
```
POST /billing/invoices
Authorization: Bearer <access_token> (Admin/Staff only)
Content-Type: application/json

Request:
{
  "patientId": "uuid-patient",
  "lineItems": [
    {
      "description": "Doctor Consultation",
      "quantity": 1,
      "unitPrice": 150,
      "category": "consultation"
    },
    {
      "description": "Blood Test",
      "quantity": 1,
      "unitPrice": 50,
      "category": "test"
    }
  ],
  "discount": 10,
  "taxPercentage": 8
}

Response: 201
{ ... invoice data ... }
```

#### Record Payment
```
POST /billing/invoices/:invoiceId/payment
Authorization: Bearer <access_token>
Content-Type: application/json

Request:
{
  "amount": 108,
  "method": "card",
  "transactionId": "txn_123456",
  "reference": "Payment via Stripe"
}

Response: 200
{ ... updated invoice with payment record ... }
```

---

### Laboratory

#### List Lab Tests
```
GET /laboratory/tests?patientId=uuid&status=completed
Authorization: Bearer <access_token>

Response: 200
{
  "data": [
    {
      "id": "uuid-test-1",
      "testName": "Complete Blood Count",
      "testCode": "CBC",
      "patient": { "firstName": "Jane", "lastName": "Smith" },
      "status": "reported",
      "orderedDate": "2024-02-20",
      "completionDate": "2024-02-22",
      "testResults": [
        {
          "parameter": "WBC",
          "value": "7.5",
          "unit": "10^3/µL",
          "normalRange": "4.5-11.0",
          "status": "normal"
        }
      ],
      "interpretation": "All values within normal range",
      "reportPdfUrl": "https://s3.amazonaws.com/..."
    }
  ]
}
```

#### Order Lab Test
```
POST /laboratory/tests
Authorization: Bearer <access_token> (Doctor only)
Content-Type: application/json

Request:
{
  "patientId": "uuid-patient",
  "testName": "Lipid Panel",
  "description": "Check cholesterol levels"
}

Response: 201
{ ... test data ... }
```

#### Update Test Results
```
PATCH /laboratory/tests/:testId
Authorization: Bearer <access_token> (Lab Technician only)
Content-Type: application/json

Request:
{
  "status": "completed",
  "testResults": [
    {
      "parameter": "Total Cholesterol",
      "value": "200",
      "unit": "mg/dL",
      "normalRange": "<200",
      "status": "normal"
    }
  ],
  "interpretation": "Cholesterol levels are within healthy range"
}

Response: 200
{ ... updated test data ... }
```

---

### Pharmacy

#### List Medicines
```
GET /pharmacy/medicines?search=aspirin&stock=true
Authorization: Bearer <access_token>

Response: 200
{
  "data": [
    {
      "id": "uuid-med-1",
      "medicineCode": "MED-000001",
      "name": "Aspirin",
      "genericName": "Acetylsalicylic Acid",
      "strength": "500mg",
      "formulation": "Tablet",
      "manufacturer": "Bayer",
      "purchasePrice": 0.50,
      "sellingPrice": 2.50,
      "stock": 500,
      "reorderLevel": 50,
      "expiryDate": "2025-12-31"
    }
  ]
}
```

#### Update Medicine Stock
```
PATCH /pharmacy/medicines/:medicineId
Authorization: Bearer <access_token> (Pharmacist/Admin only)
Content-Type: application/json

Request:
{
  "stock": 450,
  "batchNumber": "BATCH-2024-001"
}

Response: 200
{ ... updated medicine data ... }
```

---

### Dashboard & Analytics

#### Get Dashboard Metrics
```
GET /dashboard/metrics?period=month
Authorization: Bearer <access_token>

Response: 200
{
  "totalPatients": 1234,
  "activeAppointments": 45,
  "activeDoctors": 23,
  "monthlyRevenue": 45000,
  "appointmentCompletionRate": 92.5,
  "averagePatientRating": 4.7
}
```

#### Get Revenue Report
```
GET /dashboard/revenue?startDate=2024-01-01&endDate=2024-02-28
Authorization: Bearer <access_token> (Admin only)

Response: 200
{
  "totalRevenue": 150000,
  "byCategory": {
    "consultation": 75000,
    "tests": 25000,
    "medicines": 30000,
    "procedures": 20000
  },
  "monthlyTrend": [
    { "month": "January", "revenue": 70000 },
    { "month": "February", "revenue": 80000 }
  ]
}
```

---

## Error Codes

| Code | Status | Description |
|------|--------|-------------|
| 400 | Bad Request | Invalid request parameters |
| 401 | Unauthorized | Missing or invalid authentication |
| 403 | Forbidden | User lacks required permissions |
| 404 | Not Found | Resource not found |
| 409 | Conflict | Appointment conflict detected |
| 422 | Unprocessable | Validation failed |
| 500 | Server Error | Internal server error |

---

## Rate Limiting

- Unauthenticated requests: 10 requests/minute
- Authenticated requests: 100 requests/minute
- Admin requests: 1000 requests/minute

---

**Last Updated**: February 2026
