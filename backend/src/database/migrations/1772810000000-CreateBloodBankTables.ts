import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateBloodBankTables1772810000000 implements MigrationInterface {
  name = 'CreateBloodBankTables1772810000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Enums
    await queryRunner.query(`CREATE TYPE "blood_group_enum" AS ENUM ('A+', 'A-', 'B+', 'B-', 'O+', 'O-', 'AB+', 'AB-')`);
    await queryRunner.query(`CREATE TYPE "blood_component_enum" AS ENUM ('whole_blood', 'packed_rbc', 'platelets', 'plasma', 'cryoprecipitate')`);
    await queryRunner.query(`CREATE TYPE "blood_inventory_status_enum" AS ENUM ('available', 'reserved', 'issued', 'expired', 'discarded')`);
    await queryRunner.query(`CREATE TYPE "blood_request_priority_enum" AS ENUM ('routine', 'urgent', 'emergency')`);
    await queryRunner.query(`CREATE TYPE "blood_request_status_enum" AS ENUM ('pending', 'approved', 'issued', 'cancelled', 'completed')`);

    // Blood Inventory table
    await queryRunner.query(`
      CREATE TABLE "blood_inventory" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "organizationId" uuid NOT NULL,
        "bloodGroup" "blood_group_enum" NOT NULL,
        "component" "blood_component_enum" NOT NULL DEFAULT 'whole_blood',
        "units" integer NOT NULL DEFAULT 1,
        "bagNumber" character varying(100) NOT NULL,
        "collectedDate" date NOT NULL,
        "expiryDate" date NOT NULL,
        "status" "blood_inventory_status_enum" NOT NULL DEFAULT 'available',
        "donorName" character varying(200) NOT NULL,
        "donorContact" character varying(50),
        "donorAge" integer,
        "crossMatchResult" character varying(200),
        "storageLocation" character varying(200),
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_blood_inventory_id" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_blood_inventory_bagNumber" UNIQUE ("bagNumber")
      )
    `);

    await queryRunner.query(`CREATE INDEX "IDX_blood_inventory_org_group_status" ON "blood_inventory" ("organizationId", "bloodGroup", "status")`);
    await queryRunner.query(`
      ALTER TABLE "blood_inventory"
      ADD CONSTRAINT "FK_blood_inventory_organizationId"
      FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE CASCADE
    `);

    // Blood Request table
    await queryRunner.query(`
      CREATE TABLE "blood_request" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "organizationId" uuid NOT NULL,
        "patientId" uuid NOT NULL,
        "doctorId" uuid NOT NULL,
        "bloodGroup" "blood_group_enum" NOT NULL,
        "component" "blood_component_enum" NOT NULL DEFAULT 'whole_blood',
        "unitsRequested" integer NOT NULL DEFAULT 1,
        "unitsIssued" integer NOT NULL DEFAULT 0,
        "priority" "blood_request_priority_enum" NOT NULL DEFAULT 'routine',
        "status" "blood_request_status_enum" NOT NULL DEFAULT 'pending',
        "requestDate" TIMESTAMP NOT NULL DEFAULT now(),
        "requiredDate" TIMESTAMP,
        "issuedDate" TIMESTAMP,
        "reason" character varying(500) NOT NULL,
        "notes" text,
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_blood_request_id" PRIMARY KEY ("id")
      )
    `);

    await queryRunner.query(`CREATE INDEX "IDX_blood_request_organizationId" ON "blood_request" ("organizationId")`);
    await queryRunner.query(`CREATE INDEX "IDX_blood_request_status" ON "blood_request" ("status")`);
    await queryRunner.query(`
      ALTER TABLE "blood_request"
      ADD CONSTRAINT "FK_blood_request_organizationId" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE CASCADE
    `);
    await queryRunner.query(`
      ALTER TABLE "blood_request"
      ADD CONSTRAINT "FK_blood_request_patientId" FOREIGN KEY ("patientId") REFERENCES "patients"("id") ON DELETE CASCADE
    `);
    await queryRunner.query(`
      ALTER TABLE "blood_request"
      ADD CONSTRAINT "FK_blood_request_doctorId" FOREIGN KEY ("doctorId") REFERENCES "doctors"("id") ON DELETE CASCADE
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS "blood_request"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "blood_inventory"`);
    await queryRunner.query(`DROP TYPE IF EXISTS "blood_request_status_enum"`);
    await queryRunner.query(`DROP TYPE IF EXISTS "blood_request_priority_enum"`);
    await queryRunner.query(`DROP TYPE IF EXISTS "blood_inventory_status_enum"`);
    await queryRunner.query(`DROP TYPE IF EXISTS "blood_component_enum"`);
    await queryRunner.query(`DROP TYPE IF EXISTS "blood_group_enum"`);
  }
}
