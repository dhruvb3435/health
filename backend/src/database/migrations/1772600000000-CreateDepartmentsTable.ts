import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateDepartmentsTable1772600000000 implements MigrationInterface {
  name = 'CreateDepartmentsTable1772600000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE "departments" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "organizationId" uuid NOT NULL,
        "name" character varying(200) NOT NULL,
        "description" character varying(500),
        "headOfDepartmentId" uuid,
        "isActive" boolean NOT NULL DEFAULT true,
        "parentDepartmentId" uuid,
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
        "deletedAt" TIMESTAMP,
        CONSTRAINT "PK_departments_id" PRIMARY KEY ("id")
      )
    `);

    // Indexes
    await queryRunner.query(`CREATE INDEX "IDX_departments_organizationId" ON "departments" ("organizationId")`);
    await queryRunner.query(`CREATE UNIQUE INDEX "IDX_departments_orgId_name" ON "departments" ("organizationId", "name")`);

    // Foreign keys
    await queryRunner.query(`
      ALTER TABLE "departments"
      ADD CONSTRAINT "FK_departments_organizationId"
      FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE CASCADE
    `);
    await queryRunner.query(`
      ALTER TABLE "departments"
      ADD CONSTRAINT "FK_departments_parentDepartmentId"
      FOREIGN KEY ("parentDepartmentId") REFERENCES "departments"("id") ON DELETE SET NULL
    `);

    // Fix staff.departmentId column type from varchar to uuid before adding FK
    await queryRunner.query(`
      ALTER TABLE "staff"
      ALTER COLUMN "departmentId" TYPE uuid USING NULLIF("departmentId", '')::uuid
    `);

    // Add foreign key from staff.departmentId to departments.id
    await queryRunner.query(`
      ALTER TABLE "staff"
      ADD CONSTRAINT "FK_staff_departmentId"
      FOREIGN KEY ("departmentId") REFERENCES "departments"("id") ON DELETE SET NULL
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Remove staff FK first
    await queryRunner.query(`ALTER TABLE "staff" DROP CONSTRAINT IF EXISTS "FK_staff_departmentId"`);

    // Drop departments table and its constraints
    await queryRunner.query(`ALTER TABLE "departments" DROP CONSTRAINT IF EXISTS "FK_departments_parentDepartmentId"`);
    await queryRunner.query(`ALTER TABLE "departments" DROP CONSTRAINT IF EXISTS "FK_departments_organizationId"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_departments_orgId_name"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_departments_organizationId"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "departments"`);
  }
}
