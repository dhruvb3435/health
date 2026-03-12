import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateOpdQueueTable1772700000000 implements MigrationInterface {
  name = 'CreateOpdQueueTable1772700000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Create enum types
    await queryRunner.query(`
      CREATE TYPE "opd_queue_status_enum" AS ENUM ('waiting', 'in_consultation', 'completed', 'cancelled', 'no_show')
    `);
    await queryRunner.query(`
      CREATE TYPE "opd_queue_priority_enum" AS ENUM ('normal', 'urgent', 'emergency')
    `);

    // Create opd_queue table
    await queryRunner.query(`
      CREATE TABLE "opd_queue" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "organizationId" uuid NOT NULL,
        "patientId" uuid NOT NULL,
        "doctorId" uuid NOT NULL,
        "tokenNumber" integer NOT NULL,
        "queueDate" date NOT NULL,
        "status" "opd_queue_status_enum" NOT NULL DEFAULT 'waiting',
        "priority" "opd_queue_priority_enum" NOT NULL DEFAULT 'normal',
        "checkinTime" TIMESTAMP,
        "consultationStartTime" TIMESTAMP,
        "consultationEndTime" TIMESTAMP,
        "appointmentId" uuid,
        "notes" text,
        "chiefComplaint" text,
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_opd_queue_id" PRIMARY KEY ("id")
      )
    `);

    // Indexes
    await queryRunner.query(`CREATE INDEX "IDX_opd_queue_organizationId" ON "opd_queue" ("organizationId")`);
    await queryRunner.query(`CREATE INDEX "IDX_opd_queue_queueDate" ON "opd_queue" ("queueDate")`);
    await queryRunner.query(`CREATE INDEX "IDX_opd_queue_status" ON "opd_queue" ("status")`);
    await queryRunner.query(`CREATE UNIQUE INDEX "IDX_opd_queue_org_date_token" ON "opd_queue" ("organizationId", "queueDate", "tokenNumber")`);

    // Foreign keys
    await queryRunner.query(`
      ALTER TABLE "opd_queue"
      ADD CONSTRAINT "FK_opd_queue_organizationId"
      FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE CASCADE
    `);
    await queryRunner.query(`
      ALTER TABLE "opd_queue"
      ADD CONSTRAINT "FK_opd_queue_patientId"
      FOREIGN KEY ("patientId") REFERENCES "patients"("id") ON DELETE CASCADE
    `);
    await queryRunner.query(`
      ALTER TABLE "opd_queue"
      ADD CONSTRAINT "FK_opd_queue_doctorId"
      FOREIGN KEY ("doctorId") REFERENCES "doctors"("id") ON DELETE CASCADE
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "opd_queue" DROP CONSTRAINT IF EXISTS "FK_opd_queue_doctorId"`);
    await queryRunner.query(`ALTER TABLE "opd_queue" DROP CONSTRAINT IF EXISTS "FK_opd_queue_patientId"`);
    await queryRunner.query(`ALTER TABLE "opd_queue" DROP CONSTRAINT IF EXISTS "FK_opd_queue_organizationId"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_opd_queue_org_date_token"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_opd_queue_status"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_opd_queue_queueDate"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_opd_queue_organizationId"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "opd_queue"`);
    await queryRunner.query(`DROP TYPE IF EXISTS "opd_queue_priority_enum"`);
    await queryRunner.query(`DROP TYPE IF EXISTS "opd_queue_status_enum"`);
  }
}
