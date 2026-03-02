import { MigrationInterface, QueryRunner } from "typeorm";

export class Phase6PolishGrowth1772500000000 implements MigrationInterface {
    name = 'Phase6PolishGrowth1772500000000'

    public async up(queryRunner: QueryRunner): Promise<void> {
        // 1. New table: onboarding_progress
        await queryRunner.query(`
            CREATE TABLE IF NOT EXISTS "onboarding_progress" (
                "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
                "organization_id" uuid NOT NULL,
                "current_step" int NOT NULL DEFAULT 1,
                "completed_steps" jsonb NOT NULL DEFAULT '[]',
                "is_completed" boolean NOT NULL DEFAULT false,
                "metadata" jsonb,
                "created_at" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
                "updated_at" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
                CONSTRAINT "FK_onboarding_progress_org" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE CASCADE
            )
        `);

        await queryRunner.query(`
            CREATE UNIQUE INDEX IF NOT EXISTS "idx_onboarding_progress_org"
                ON "onboarding_progress"("organization_id")
        `);

        // 2. New table: notifications
        await queryRunner.query(`
            CREATE TABLE IF NOT EXISTS "notifications" (
                "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
                "organization_id" uuid NOT NULL,
                "user_id" uuid,
                "type" varchar(50) NOT NULL,
                "title" varchar(255) NOT NULL,
                "message" text NOT NULL,
                "data" jsonb,
                "is_read" boolean NOT NULL DEFAULT false,
                "created_at" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
                CONSTRAINT "FK_notifications_org" FOREIGN KEY ("organization_id") REFERENCES "organizations"("id") ON DELETE CASCADE,
                CONSTRAINT "FK_notifications_user" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE SET NULL
            )
        `);

        await queryRunner.query(`
            CREATE INDEX IF NOT EXISTS "idx_notifications_org_read_date"
                ON "notifications"("organization_id", "is_read", "created_at" DESC)
        `);

        await queryRunner.query(`
            CREATE INDEX IF NOT EXISTS "idx_notifications_user_read"
                ON "notifications"("user_id", "is_read")
                WHERE "user_id" IS NOT NULL
        `);

        // 3. Trigger to auto-update updated_at on onboarding_progress
        await queryRunner.query(`
            CREATE OR REPLACE FUNCTION update_updated_at_column()
            RETURNS TRIGGER AS $$
            BEGIN
                NEW.updated_at = NOW();
                RETURN NEW;
            END;
            $$ language 'plpgsql'
        `);

        await queryRunner.query(`
            DROP TRIGGER IF EXISTS update_onboarding_progress_updated_at ON "onboarding_progress"
        `);

        await queryRunner.query(`
            CREATE TRIGGER update_onboarding_progress_updated_at
                BEFORE UPDATE ON "onboarding_progress"
                FOR EACH ROW EXECUTE FUNCTION update_updated_at_column()
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP TRIGGER IF EXISTS update_onboarding_progress_updated_at ON "onboarding_progress"`);
        await queryRunner.query(`DROP FUNCTION IF EXISTS update_updated_at_column()`);
        await queryRunner.query(`DROP INDEX IF EXISTS "idx_notifications_user_read"`);
        await queryRunner.query(`DROP INDEX IF EXISTS "idx_notifications_org_read_date"`);
        await queryRunner.query(`DROP TABLE IF EXISTS "notifications"`);
        await queryRunner.query(`DROP INDEX IF EXISTS "idx_onboarding_progress_org"`);
        await queryRunner.query(`DROP TABLE IF EXISTS "onboarding_progress"`);
    }
}
