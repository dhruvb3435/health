import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateInsuranceTables1772830000000 implements MigrationInterface {
    name = 'CreateInsuranceTables1772830000000';

    public async up(queryRunner: QueryRunner): Promise<void> {
        // Create treatment_type_enum
        await queryRunner.query(`
            DO $$ BEGIN
                CREATE TYPE "treatment_type_enum" AS ENUM('cashless', 'reimbursement');
            EXCEPTION WHEN duplicate_object THEN null;
            END $$;
        `);

        // Create claim_status_enum
        await queryRunner.query(`
            DO $$ BEGIN
                CREATE TYPE "claim_status_enum" AS ENUM(
                    'draft', 'submitted', 'under_review', 'query_raised',
                    'approved', 'partially_approved', 'rejected', 'settled', 'cancelled'
                );
            EXCEPTION WHEN duplicate_object THEN null;
            END $$;
        `);

        // Insurance Providers table
        await queryRunner.query(`
            CREATE TABLE IF NOT EXISTS "insurance_providers" (
                "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
                "organizationId" uuid NOT NULL,
                "providerName" varchar(200) NOT NULL,
                "providerCode" varchar(50) NOT NULL,
                "contactPerson" varchar(200),
                "contactEmail" varchar(255),
                "contactPhone" varchar(20),
                "address" text,
                "panNumber" varchar(20),
                "gstNumber" varchar(20),
                "isActive" boolean NOT NULL DEFAULT true,
                "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
                "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
                CONSTRAINT "PK_insurance_providers" PRIMARY KEY ("id"),
                CONSTRAINT "FK_insurance_providers_org" FOREIGN KEY ("organizationId")
                    REFERENCES "organizations"("id") ON DELETE CASCADE
            );
        `);

        await queryRunner.query(`CREATE UNIQUE INDEX IF NOT EXISTS "IDX_insurance_providers_org_code" ON "insurance_providers" ("organizationId", "providerCode");`);
        await queryRunner.query(`CREATE INDEX IF NOT EXISTS "IDX_insurance_providers_org_active" ON "insurance_providers" ("organizationId", "isActive");`);

        // Insurance Claims table
        await queryRunner.query(`
            CREATE TABLE IF NOT EXISTS "insurance_claims" (
                "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
                "organizationId" uuid NOT NULL,
                "claimNumber" varchar(50) NOT NULL,
                "patientId" uuid NOT NULL,
                "doctorId" uuid,
                "providerId" uuid NOT NULL,
                "invoiceId" uuid,
                "policyNumber" varchar(100) NOT NULL,
                "policyHolderName" varchar(200) NOT NULL,
                "relationToPatient" varchar(50),
                "admissionDate" date,
                "dischargeDate" date,
                "diagnosisCode" varchar(20),
                "diagnosisDescription" text NOT NULL,
                "treatmentType" "treatment_type_enum" NOT NULL,
                "claimAmount" decimal(10,2) NOT NULL,
                "approvedAmount" decimal(10,2) NOT NULL DEFAULT 0,
                "settledAmount" decimal(10,2) NOT NULL DEFAULT 0,
                "deductionAmount" decimal(10,2) NOT NULL DEFAULT 0,
                "deductionReason" text,
                "status" "claim_status_enum" NOT NULL DEFAULT 'draft',
                "tpaReferenceNumber" varchar(100),
                "preAuthNumber" varchar(100),
                "preAuthDate" date,
                "submittedDate" date,
                "approvedDate" date,
                "settledDate" date,
                "rejectionReason" text,
                "queryDetails" text,
                "documents" jsonb,
                "remarks" text,
                "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
                "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
                CONSTRAINT "PK_insurance_claims" PRIMARY KEY ("id"),
                CONSTRAINT "FK_insurance_claims_org" FOREIGN KEY ("organizationId")
                    REFERENCES "organizations"("id") ON DELETE CASCADE,
                CONSTRAINT "FK_insurance_claims_patient" FOREIGN KEY ("patientId")
                    REFERENCES "patients"("id") ON DELETE RESTRICT,
                CONSTRAINT "FK_insurance_claims_doctor" FOREIGN KEY ("doctorId")
                    REFERENCES "doctors"("id") ON DELETE RESTRICT,
                CONSTRAINT "FK_insurance_claims_provider" FOREIGN KEY ("providerId")
                    REFERENCES "insurance_providers"("id") ON DELETE RESTRICT
            );
        `);

        await queryRunner.query(`CREATE UNIQUE INDEX IF NOT EXISTS "IDX_insurance_claims_org_number" ON "insurance_claims" ("organizationId", "claimNumber");`);
        await queryRunner.query(`CREATE INDEX IF NOT EXISTS "IDX_insurance_claims_org_status" ON "insurance_claims" ("organizationId", "status");`);
        await queryRunner.query(`CREATE INDEX IF NOT EXISTS "IDX_insurance_claims_org_provider" ON "insurance_claims" ("organizationId", "providerId");`);
        await queryRunner.query(`CREATE INDEX IF NOT EXISTS "IDX_insurance_claims_org_patient" ON "insurance_claims" ("organizationId", "patientId");`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP TABLE IF EXISTS "insurance_claims";`);
        await queryRunner.query(`DROP TABLE IF EXISTS "insurance_providers";`);
        await queryRunner.query(`DROP TYPE IF EXISTS "claim_status_enum";`);
        await queryRunner.query(`DROP TYPE IF EXISTS "treatment_type_enum";`);
    }
}
