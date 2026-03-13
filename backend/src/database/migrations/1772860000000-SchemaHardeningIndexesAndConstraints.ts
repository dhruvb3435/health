import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Comprehensive schema hardening migration:
 * 1. Adds missing indexes on FK columns for JOIN performance
 * 2. Adds missing composite indexes for multi-tenant query patterns
 * 3. Adds VARCHAR length constraints on string columns
 * 4. Adds missing createdAt column to organization_usage
 */
export class SchemaHardeningIndexesAndConstraints1772860000000 implements MigrationInterface {
  name = 'SchemaHardeningIndexesAndConstraints1772860000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // =========================================================================
    // 1. MISSING FK INDEXES (performance-critical for JOINs)
    // =========================================================================

    // emergency_cases
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS "IDX_emergency_patientId" ON "emergency_cases" ("patientId")`);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS "IDX_emergency_doctorId" ON "emergency_cases" ("doctorId")`);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS "IDX_emergency_org_arrivalTime" ON "emergency_cases" ("organizationId", "arrivalTime")`);

    // insurance_providers
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS "IDX_insurance_provider_orgId" ON "insurance_providers" ("organizationId")`);

    // insurance_claims
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS "IDX_insurance_claim_doctorId" ON "insurance_claims" ("doctorId")`);

    // feature_limits
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS "IDX_feature_limit_planId" ON "feature_limits" ("planId")`);

    // subscriptions
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS "IDX_subscription_planId" ON "subscriptions" ("planId")`);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS "IDX_subscription_currentPeriodEnd" ON "subscriptions" ("currentPeriodEnd")`);

    // payments
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS "IDX_payment_subscriptionId" ON "payments" ("subscriptionId")`);

    // invoices - patientId individual index
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS "IDX_invoice_patientId" ON "invoices" ("patientId")`);

    // ambulance_trips
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS "IDX_ambulance_trip_ambulanceId" ON "ambulance_trips" ("ambulanceId")`);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS "IDX_ambulance_trip_patientId" ON "ambulance_trips" ("patientId")`);

    // departments
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS "IDX_department_parentDeptId" ON "departments" ("parentDepartmentId")`);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS "IDX_department_org_isActive" ON "departments" ("organizationId", "isActive")`);

    // staff
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS "IDX_staff_orgId" ON "staff" ("organizationId")`);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS "IDX_staff_departmentId" ON "staff" ("departmentId")`);

    // wards
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS "IDX_ward_orgId" ON "wards" ("organizationId")`);

    // beds
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS "IDX_bed_orgId" ON "beds" ("organizationId")`);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS "IDX_bed_status" ON "beds" ("status")`);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS "IDX_bed_assignedPatientId" ON "beds" ("assignedPatientId")`);

    // notifications
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS "IDX_notification_createdAt" ON "notifications" ("created_at")`);

    // medical_records
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS "IDX_medical_record_visitDate" ON "medical_records" ("visitDate")`);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS "IDX_medical_record_org_recordType" ON "medical_records" ("organizationId", "recordType")`);

    // =========================================================================
    // 2. MISSING COMPOSITE INDEXES (multi-tenant query patterns)
    // =========================================================================

    // lab_tests: org + status, org + patientId
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS "IDX_lab_test_org_status" ON "lab_tests" ("organizationId", "status")`);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS "IDX_lab_test_org_patientId" ON "lab_tests" ("organizationId", "patientId")`);

    // expenses: org + status, org + expenseDate
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS "IDX_expense_org_status" ON "expenses" ("organizationId", "status")`);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS "IDX_expense_org_expenseDate" ON "expenses" ("organizationId", "expenseDate")`);

    // revenue: org + source, org + date
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS "IDX_revenue_org_source" ON "revenue" ("organizationId", "source")`);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS "IDX_revenue_org_date" ON "revenue" ("organizationId", "date")`);

    // staff: org + status, org + role
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS "IDX_staff_org_status" ON "staff" ("organizationId", "status")`);

    // medicines: org + stock (low stock queries)
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS "IDX_medicine_org_stock" ON "medicines" ("organizationId", "stock")`);

    // appointments: org + appointmentDate (today's appointments)
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS "IDX_appointment_org_date" ON "appointments" ("organizationId", "appointmentDate")`);

    // admissions: org + status
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS "IDX_admission_org_status" ON "admissions" ("organizationId", "status")`);

    // beds: wardId + bedNumber (non-unique; duplicates may exist in seed data)
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS "IDX_bed_ward_bedNumber" ON "beds" ("wardId", "bedNumber")`);

    // =========================================================================
    // 3. VARCHAR LENGTH CONSTRAINTS
    // =========================================================================

    // -- users table --
    await queryRunner.query(`ALTER TABLE "users" ALTER COLUMN "userId" TYPE varchar(50)`);
    await queryRunner.query(`ALTER TABLE "users" ALTER COLUMN "firstName" TYPE varchar(100)`);
    await queryRunner.query(`ALTER TABLE "users" ALTER COLUMN "lastName" TYPE varchar(100)`);
    await queryRunner.query(`ALTER TABLE "users" ALTER COLUMN "phoneNumber" TYPE varchar(20)`);
    await queryRunner.query(`ALTER TABLE "users" ALTER COLUMN "address" TYPE varchar(500)`);
    await queryRunner.query(`ALTER TABLE "users" ALTER COLUMN "city" TYPE varchar(100)`);
    await queryRunner.query(`ALTER TABLE "users" ALTER COLUMN "state" TYPE varchar(100)`);
    await queryRunner.query(`ALTER TABLE "users" ALTER COLUMN "postalCode" TYPE varchar(20)`);
    await queryRunner.query(`ALTER TABLE "users" ALTER COLUMN "country" TYPE varchar(100)`);

    // -- organizations table --
    await queryRunner.query(`ALTER TABLE "organizations" ALTER COLUMN "name" TYPE varchar(255)`);
    await queryRunner.query(`ALTER TABLE "organizations" ALTER COLUMN "slug" TYPE varchar(100)`);

    // -- emergency_cases table --
    await queryRunner.query(`ALTER TABLE "emergency_cases" ALTER COLUMN "caseNumber" TYPE varchar(50)`);
    await queryRunner.query(`ALTER TABLE "emergency_cases" ALTER COLUMN "injuryType" TYPE varchar(100)`);
    await queryRunner.query(`ALTER TABLE "emergency_cases" ALTER COLUMN "disposition" TYPE varchar(500)`);

    // -- lab_tests table --
    await queryRunner.query(`ALTER TABLE "lab_tests" ALTER COLUMN "testName" TYPE varchar(255)`);
    await queryRunner.query(`ALTER TABLE "lab_tests" ALTER COLUMN "testCode" TYPE varchar(50)`);
    await queryRunner.query(`ALTER TABLE "lab_tests" ALTER COLUMN "orderedBy" TYPE varchar(255)`);
    await queryRunner.query(`ALTER TABLE "lab_tests" ALTER COLUMN "reportedBy" TYPE varchar(255)`);

    // -- expenses table --
    await queryRunner.query(`ALTER TABLE "expenses" ALTER COLUMN "expenseId" TYPE varchar(50)`);
    await queryRunner.query(`ALTER TABLE "expenses" ALTER COLUMN "description" TYPE varchar(500)`);
    await queryRunner.query(`ALTER TABLE "expenses" ALTER COLUMN "vendorName" TYPE varchar(255)`);
    await queryRunner.query(`ALTER TABLE "expenses" ALTER COLUMN "invoiceNumber" TYPE varchar(50)`);
    await queryRunner.query(`ALTER TABLE "expenses" ALTER COLUMN "approvedBy" TYPE varchar(36)`);

    // -- revenue table --
    await queryRunner.query(`ALTER TABLE "revenue" ALTER COLUMN "revenueId" TYPE varchar(50)`);
    await queryRunner.query(`ALTER TABLE "revenue" ALTER COLUMN "source" TYPE varchar(100)`);
    await queryRunner.query(`ALTER TABLE "revenue" ALTER COLUMN "remarks" TYPE varchar(500)`);

    // -- insurance_providers table --
    await queryRunner.query(`ALTER TABLE "insurance_providers" ALTER COLUMN "contactEmail" TYPE varchar(255)`);
    await queryRunner.query(`ALTER TABLE "insurance_providers" ALTER COLUMN "contactPhone" TYPE varchar(20)`);
    await queryRunner.query(`ALTER TABLE "insurance_providers" ALTER COLUMN "panNumber" TYPE varchar(20)`);
    await queryRunner.query(`ALTER TABLE "insurance_providers" ALTER COLUMN "gstNumber" TYPE varchar(20)`);

    // -- insurance_claims table --
    await queryRunner.query(`ALTER TABLE "insurance_claims" ALTER COLUMN "invoiceId" TYPE varchar(36)`);
    await queryRunner.query(`ALTER TABLE "insurance_claims" ALTER COLUMN "relationToPatient" TYPE varchar(50)`);
    await queryRunner.query(`ALTER TABLE "insurance_claims" ALTER COLUMN "diagnosisCode" TYPE varchar(20)`);
    await queryRunner.query(`ALTER TABLE "insurance_claims" ALTER COLUMN "tpaReferenceNumber" TYPE varchar(100)`);
    await queryRunner.query(`ALTER TABLE "insurance_claims" ALTER COLUMN "preAuthNumber" TYPE varchar(100)`);

    // -- plans table --
    await queryRunner.query(`ALTER TABLE "plans" ALTER COLUMN "name" TYPE varchar(100)`);
    await queryRunner.query(`ALTER TABLE "plans" ALTER COLUMN "slug" TYPE varchar(100)`);
    await queryRunner.query(`ALTER TABLE "plans" ALTER COLUMN "currency" TYPE varchar(3)`);
    await queryRunner.query(`ALTER TABLE "plans" ALTER COLUMN "productId" TYPE varchar(255)`);
    await queryRunner.query(`ALTER TABLE "plans" ALTER COLUMN "priceId" TYPE varchar(255)`);

    // -- subscriptions table --
    await queryRunner.query(`ALTER TABLE "subscriptions" ALTER COLUMN "gatewaySubscriptionId" TYPE varchar(255)`);
    await queryRunner.query(`ALTER TABLE "subscriptions" ALTER COLUMN "gatewayCustomerId" TYPE varchar(255)`);

    // -- feature_limits table --
    await queryRunner.query(`ALTER TABLE "feature_limits" ALTER COLUMN "featureKey" TYPE varchar(100)`);

    // -- organization_usage table --
    await queryRunner.query(`ALTER TABLE "organization_usage" ALTER COLUMN "feature_key" TYPE varchar(100)`);

    // -- payments table --
    await queryRunner.query(`ALTER TABLE "payments" ALTER COLUMN "currency" TYPE varchar(3)`);
    await queryRunner.query(`ALTER TABLE "payments" ALTER COLUMN "paymentMethod" TYPE varchar(50)`);
    await queryRunner.query(`ALTER TABLE "payments" ALTER COLUMN "gatewayTransactionId" TYPE varchar(255)`);
    await queryRunner.query(`ALTER TABLE "payments" ALTER COLUMN "invoiceUrl" TYPE varchar(500)`);

    // -- invoices table --
    await queryRunner.query(`ALTER TABLE "invoices" ALTER COLUMN "invoiceNumber" TYPE varchar(50)`);
    await queryRunner.query(`ALTER TABLE "invoices" ALTER COLUMN "notes" TYPE varchar(500)`);
    await queryRunner.query(`ALTER TABLE "invoices" ALTER COLUMN "insuranceClaimId" TYPE varchar(36)`);
    await queryRunner.query(`ALTER TABLE "invoices" ALTER COLUMN "pdfUrl" TYPE varchar(500)`);

    // -- departments table --
    await queryRunner.query(`ALTER TABLE "departments" ALTER COLUMN "headOfDepartmentId" TYPE varchar(36)`);

    // -- wards table --
    await queryRunner.query(`ALTER TABLE "wards" ALTER COLUMN "wardCode" TYPE varchar(50)`);
    await queryRunner.query(`ALTER TABLE "wards" ALTER COLUMN "wardName" TYPE varchar(255)`);
    await queryRunner.query(`ALTER TABLE "wards" ALTER COLUMN "description" TYPE varchar(500)`);
    await queryRunner.query(`ALTER TABLE "wards" ALTER COLUMN "wardIncharge" TYPE varchar(36)`);
    await queryRunner.query(`ALTER TABLE "wards" ALTER COLUMN "floor" TYPE varchar(50)`);
    await queryRunner.query(`ALTER TABLE "wards" ALTER COLUMN "block" TYPE varchar(50)`);
    await queryRunner.query(`ALTER TABLE "wards" ALTER COLUMN "remarks" TYPE varchar(500)`);

    // -- beds table --
    await queryRunner.query(`ALTER TABLE "beds" ALTER COLUMN "bedNumber" TYPE varchar(50)`);
    await queryRunner.query(`ALTER TABLE "beds" ALTER COLUMN "remarks" TYPE varchar(500)`);

    // -- ambulances table --
    await queryRunner.query(`ALTER TABLE "ambulances" ALTER COLUMN "currentLocation" TYPE varchar(500)`);

    // -- ambulance_trips table --
    await queryRunner.query(`ALTER TABLE "ambulance_trips" ALTER COLUMN "tripNumber" TYPE varchar(50)`);
    await queryRunner.query(`ALTER TABLE "ambulance_trips" ALTER COLUMN "patientName" TYPE varchar(255)`);
    await queryRunner.query(`ALTER TABLE "ambulance_trips" ALTER COLUMN "patientContact" TYPE varchar(20)`);

    // -- medicines table --
    await queryRunner.query(`ALTER TABLE "medicines" ALTER COLUMN "medicineCode" TYPE varchar(50)`);
    await queryRunner.query(`ALTER TABLE "medicines" ALTER COLUMN "name" TYPE varchar(255)`);
    await queryRunner.query(`ALTER TABLE "medicines" ALTER COLUMN "genericName" TYPE varchar(255)`);
    await queryRunner.query(`ALTER TABLE "medicines" ALTER COLUMN "strength" TYPE varchar(100)`);
    await queryRunner.query(`ALTER TABLE "medicines" ALTER COLUMN "formulation" TYPE varchar(100)`);
    await queryRunner.query(`ALTER TABLE "medicines" ALTER COLUMN "manufacturer" TYPE varchar(255)`);
    await queryRunner.query(`ALTER TABLE "medicines" ALTER COLUMN "batchNumber" TYPE varchar(50)`);

    // -- patients table --
    await queryRunner.query(`ALTER TABLE "patients" ALTER COLUMN "patientId" TYPE varchar(50)`);
    await queryRunner.query(`ALTER TABLE "patients" ALTER COLUMN "ssn" TYPE varchar(20)`);
    await queryRunner.query(`ALTER TABLE "patients" ALTER COLUMN "insuranceProvider" TYPE varchar(255)`);
    await queryRunner.query(`ALTER TABLE "patients" ALTER COLUMN "insurancePolicyNumber" TYPE varchar(100)`);
    await queryRunner.query(`ALTER TABLE "patients" ALTER COLUMN "emergencyContactName" TYPE varchar(255)`);
    await queryRunner.query(`ALTER TABLE "patients" ALTER COLUMN "emergencyContactPhone" TYPE varchar(20)`);
    await queryRunner.query(`ALTER TABLE "patients" ALTER COLUMN "emergencyContactRelation" TYPE varchar(50)`);
    await queryRunner.query(`ALTER TABLE "patients" ALTER COLUMN "occupation" TYPE varchar(100)`);

    // -- medical_records table --
    await queryRunner.query(`ALTER TABLE "medical_records" ALTER COLUMN "recordType" TYPE varchar(100)`);
    await queryRunner.query(`ALTER TABLE "medical_records" ALTER COLUMN "title" TYPE varchar(255)`);
    await queryRunner.query(`ALTER TABLE "medical_records" ALTER COLUMN "doctorName" TYPE varchar(255)`);

    // -- staff table --
    await queryRunner.query(`ALTER TABLE "staff" ALTER COLUMN "staffId" TYPE varchar(50)`);
    await queryRunner.query(`ALTER TABLE "staff" ALTER COLUMN "specialization" TYPE varchar(100)`);
    await queryRunner.query(`ALTER TABLE "staff" ALTER COLUMN "licenseNumber" TYPE varchar(50)`);
    await queryRunner.query(`ALTER TABLE "staff" ALTER COLUMN "qualification" TYPE varchar(255)`);

    // -- appointments table --
    await queryRunner.query(`ALTER TABLE "appointments" ALTER COLUMN "appointmentTime" TYPE varchar(10)`);
    await queryRunner.query(`ALTER TABLE "appointments" ALTER COLUMN "reason" TYPE varchar(500)`);

    // =========================================================================
    // 4. MISSING createdAt ON organization_usage
    // =========================================================================
    await queryRunner.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM information_schema.columns
          WHERE table_name = 'organization_usage' AND column_name = 'created_at'
        ) THEN
          ALTER TABLE "organization_usage" ADD COLUMN "created_at" TIMESTAMP DEFAULT CURRENT_TIMESTAMP;
        END IF;
      END $$;
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Drop added indexes (in reverse order)
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_admission_org_status"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_appointment_org_date"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_medicine_org_stock"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_staff_org_status"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_revenue_org_date"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_revenue_org_source"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_expense_org_expenseDate"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_expense_org_status"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_lab_test_org_patientId"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_lab_test_org_status"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_bed_ward_bedNumber"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_medical_record_org_recordType"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_medical_record_visitDate"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_notification_createdAt"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_bed_assignedPatientId"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_bed_status"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_bed_orgId"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_ward_orgId"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_staff_departmentId"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_staff_orgId"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_department_org_isActive"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_department_parentDeptId"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_ambulance_trip_patientId"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_ambulance_trip_ambulanceId"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_invoice_patientId"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_payment_subscriptionId"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_subscription_currentPeriodEnd"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_subscription_planId"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_feature_limit_planId"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_insurance_claim_doctorId"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_insurance_provider_orgId"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_emergency_org_arrivalTime"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_emergency_doctorId"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_emergency_patientId"`);

    // Note: VARCHAR length constraints are not reverted because reverting from
    // varchar(N) to varchar (unlimited) is always safe and the original state
    // was effectively unbounded already.
  }
}
