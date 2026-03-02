import { MigrationInterface, QueryRunner } from "typeorm";

export class Phase2PatientMedicalRecordIdx1772309999999 implements MigrationInterface {
    name = 'Phase2PatientMedicalRecordIdx1772309999999'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE INDEX "IDX_patient_org_patient_id" ON "medical_records" ("organizationId", "patientId") `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP INDEX "public"."IDX_patient_org_patient_id"`);
    }

}
