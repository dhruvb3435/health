import { MigrationInterface, QueryRunner } from "typeorm";

export class RenameUsageTrackingToOrganizationUsage1772367150567 implements MigrationInterface {
    name = 'RenameUsageTrackingToOrganizationUsage1772367150567'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "organization_usage" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "organization_id" uuid NOT NULL, "feature_key" character varying NOT NULL, "used_count" integer NOT NULL DEFAULT '0', "last_reset_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_6385566de8e0f0e0b10e71fedc8" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "IDX_c14d29c69c2fcd936af129d5b8" ON "organization_usage" ("organization_id") `);
        await queryRunner.query(`CREATE UNIQUE INDEX "IDX_fafcbcfeeedd09f4e4e36a8b93" ON "organization_usage" ("organization_id", "feature_key") `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP INDEX "public"."IDX_fafcbcfeeedd09f4e4e36a8b93"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_c14d29c69c2fcd936af129d5b8"`);
        await queryRunner.query(`DROP TABLE "organization_usage"`);
    }

}
