import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateEmergencyTable1772820000000 implements MigrationInterface {
  name = 'CreateEmergencyTable1772820000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Enums
    await queryRunner.query(`
      CREATE TYPE "triage_level_enum" AS ENUM (
        'level_1_resuscitation', 'level_2_emergency', 'level_3_urgent',
        'level_4_semi_urgent', 'level_5_non_urgent'
      )
    `);
    await queryRunner.query(`
      CREATE TYPE "emergency_status_enum" AS ENUM (
        'registered', 'triaged', 'in_treatment', 'admitted',
        'discharged', 'transferred', 'deceased'
      )
    `);
    await queryRunner.query(`
      CREATE TYPE "arrival_mode_enum" AS ENUM ('walk_in', 'ambulance', 'police', 'referral')
    `);

    // Emergency Cases table
    await queryRunner.query(`
      CREATE TABLE "emergency_cases" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "organizationId" uuid NOT NULL,
        "caseNumber" character varying(50) NOT NULL,
        "patientId" uuid,
        "doctorId" uuid,
        "triageLevel" "triage_level_enum",
        "status" "emergency_status_enum" NOT NULL DEFAULT 'registered',
        "arrivalMode" "arrival_mode_enum" NOT NULL DEFAULT 'walk_in',
        "chiefComplaint" text NOT NULL,
        "vitals" jsonb,
        "injuryType" character varying(100),
        "allergies" text,
        "medicalHistory" text,
        "treatmentNotes" text,
        "disposition" character varying(500),
        "admissionId" uuid,
        "arrivalTime" TIMESTAMP NOT NULL DEFAULT now(),
        "triageTime" TIMESTAMP,
        "treatmentStartTime" TIMESTAMP,
        "dispositionTime" TIMESTAMP,
        "isActive" boolean NOT NULL DEFAULT true,
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_emergency_cases_id" PRIMARY KEY ("id")
      )
    `);

    // Indexes
    await queryRunner.query(`CREATE UNIQUE INDEX "IDX_emergency_org_caseNumber" ON "emergency_cases" ("organizationId", "caseNumber")`);
    await queryRunner.query(`CREATE INDEX "IDX_emergency_org_status" ON "emergency_cases" ("organizationId", "status")`);
    await queryRunner.query(`CREATE INDEX "IDX_emergency_org_triage" ON "emergency_cases" ("organizationId", "triageLevel")`);

    // Foreign keys
    await queryRunner.query(`
      ALTER TABLE "emergency_cases"
      ADD CONSTRAINT "FK_emergency_organizationId"
      FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE CASCADE
    `);
    await queryRunner.query(`
      ALTER TABLE "emergency_cases"
      ADD CONSTRAINT "FK_emergency_patientId"
      FOREIGN KEY ("patientId") REFERENCES "patients"("id") ON DELETE SET NULL
    `);
    await queryRunner.query(`
      ALTER TABLE "emergency_cases"
      ADD CONSTRAINT "FK_emergency_doctorId"
      FOREIGN KEY ("doctorId") REFERENCES "doctors"("id") ON DELETE SET NULL
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "emergency_cases" DROP CONSTRAINT IF EXISTS "FK_emergency_doctorId"`);
    await queryRunner.query(`ALTER TABLE "emergency_cases" DROP CONSTRAINT IF EXISTS "FK_emergency_patientId"`);
    await queryRunner.query(`ALTER TABLE "emergency_cases" DROP CONSTRAINT IF EXISTS "FK_emergency_organizationId"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_emergency_org_triage"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_emergency_org_status"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_emergency_org_caseNumber"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "emergency_cases"`);
    await queryRunner.query(`DROP TYPE IF EXISTS "arrival_mode_enum"`);
    await queryRunner.query(`DROP TYPE IF EXISTS "emergency_status_enum"`);
    await queryRunner.query(`DROP TYPE IF EXISTS "triage_level_enum"`);
  }
}
