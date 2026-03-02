import { MigrationInterface, QueryRunner } from "typeorm";

export class RenameUsageColumnsToSnakeCase1772378140767 implements MigrationInterface {
    name = 'RenameUsageColumnsToSnakeCase1772378140767'

    public async up(queryRunner: QueryRunner): Promise<void> {
        const table = await queryRunner.getTable("organization_usage");
        if (!table) return;

        if (table.findColumnByName("organizationId")) {
            await queryRunner.query(`ALTER TABLE "organization_usage" RENAME COLUMN "organizationId" TO "organization_id"`);
        }
        if (table.findColumnByName("featureKey")) {
            await queryRunner.query(`ALTER TABLE "organization_usage" RENAME COLUMN "featureKey" TO "feature_key"`);
        }
        if (table.findColumnByName("currentUsage")) {
            await queryRunner.query(`ALTER TABLE "organization_usage" RENAME COLUMN "currentUsage" TO "used_count"`);
        }
        if (table.findColumnByName("lastResetAt")) {
            await queryRunner.query(`ALTER TABLE "organization_usage" RENAME COLUMN "lastResetAt" TO "last_reset_at"`);
        }
        if (table.findColumnByName("updatedAt")) {
            await queryRunner.query(`ALTER TABLE "organization_usage" RENAME COLUMN "updatedAt" TO "updated_at"`);
        }
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        const table = await queryRunner.getTable("organization_usage");
        if (!table) return;

        if (table.findColumnByName("organization_id")) {
            await queryRunner.query(`ALTER TABLE "organization_usage" RENAME COLUMN "organization_id" TO "organizationId"`);
        }
        if (table.findColumnByName("feature_key")) {
            await queryRunner.query(`ALTER TABLE "organization_usage" RENAME COLUMN "feature_key" TO "featureKey"`);
        }
        if (table.findColumnByName("used_count")) {
            await queryRunner.query(`ALTER TABLE "organization_usage" RENAME COLUMN "used_count" TO "currentUsage"`);
        }
        if (table.findColumnByName("last_reset_at")) {
            await queryRunner.query(`ALTER TABLE "organization_usage" RENAME COLUMN "last_reset_at" TO "lastResetAt"`);
        }
        if (table.findColumnByName("updated_at")) {
            await queryRunner.query(`ALTER TABLE "organization_usage" RENAME COLUMN "updated_at" TO "updatedAt"`);
        }
    }

}
