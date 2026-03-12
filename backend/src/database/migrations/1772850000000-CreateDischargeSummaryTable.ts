import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateDischargeSummaryTable1772850000000 implements MigrationInterface {
    name = 'CreateDischargeSummaryTable1772850000000';

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            DO $$ BEGIN
                CREATE TYPE "discharge_type_enum" AS ENUM('normal', 'against_advice', 'absconded', 'referred', 'expired');
            EXCEPTION WHEN duplicate_object THEN null;
            END $$;
        `);

        await queryRunner.query(`
            DO $$ BEGIN
                CREATE TYPE "discharge_status_enum" AS ENUM('draft', 'pending_approval', 'approved', 'completed');
            EXCEPTION WHEN duplicate_object THEN null;
            END $$;
        `);

        await queryRunner.query(`
            CREATE TABLE IF NOT EXISTS "discharge_summaries" (
                "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
                "organizationId" uuid NOT NULL,
                "summaryNumber" varchar(50) NOT NULL,
                "patientId" uuid NOT NULL,
                "doctorId" uuid NOT NULL,
                "admissionId" uuid,
                "admissionDate" date NOT NULL,
                "dischargeDate" date NOT NULL,
                "dischargeType" "discharge_type_enum" NOT NULL DEFAULT 'normal',
                "status" "discharge_status_enum" NOT NULL DEFAULT 'draft',
                "diagnosisAtAdmission" text NOT NULL,
                "diagnosisAtDischarge" text,
                "chiefComplaints" text,
                "historyOfPresentIllness" text,
                "pastHistory" text,
                "examinationFindings" text,
                "investigationsPerformed" jsonb,
                "treatmentGiven" text,
                "proceduresPerformed" text,
                "courseInHospital" text,
                "conditionAtDischarge" text,
                "dischargeMedications" jsonb,
                "dietaryAdvice" text,
                "activityRestrictions" text,
                "followUpDate" date,
                "followUpInstructions" text,
                "emergencyInstructions" text,
                "referralDetails" text,
                "approvedById" uuid,
                "approvedAt" TIMESTAMP,
                "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
                "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
                CONSTRAINT "PK_discharge_summaries" PRIMARY KEY ("id"),
                CONSTRAINT "FK_discharge_summaries_org" FOREIGN KEY ("organizationId")
                    REFERENCES "organizations"("id") ON DELETE CASCADE,
                CONSTRAINT "FK_discharge_summaries_patient" FOREIGN KEY ("patientId")
                    REFERENCES "patients"("id") ON DELETE CASCADE,
                CONSTRAINT "FK_discharge_summaries_doctor" FOREIGN KEY ("doctorId")
                    REFERENCES "doctors"("id") ON DELETE CASCADE
            );
        `);

        await queryRunner.query(`CREATE UNIQUE INDEX IF NOT EXISTS "IDX_discharge_summaries_org_number" ON "discharge_summaries" ("organizationId", "summaryNumber");`);
        await queryRunner.query(`CREATE INDEX IF NOT EXISTS "IDX_discharge_summaries_org_status" ON "discharge_summaries" ("organizationId", "status");`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP TABLE IF EXISTS "discharge_summaries";`);
        await queryRunner.query(`DROP TYPE IF EXISTS "discharge_status_enum";`);
        await queryRunner.query(`DROP TYPE IF EXISTS "discharge_type_enum";`);
    }
}
