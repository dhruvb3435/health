import { MigrationInterface, QueryRunner } from "typeorm";

export class AddedSubscriptionsSchema1772348787674 implements MigrationInterface {
    name = 'AddedSubscriptionsSchema1772348787674'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "organizations" DROP COLUMN "subscriptionPlan"`);
        await queryRunner.query(`DROP TYPE "public"."organizations_subscriptionplan_enum"`);
        await queryRunner.query(`CREATE INDEX "IDX_a817b2af6d7480dce6da25c71c" ON "medical_records" ("organizationId", "patientId") `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP INDEX "public"."IDX_a817b2af6d7480dce6da25c71c"`);
        await queryRunner.query(`CREATE TYPE "public"."organizations_subscriptionplan_enum" AS ENUM('basic', 'premium', 'enterprise')`);
        await queryRunner.query(`ALTER TABLE "organizations" ADD "subscriptionPlan" "public"."organizations_subscriptionplan_enum" NOT NULL DEFAULT 'basic'`);
    }

}
