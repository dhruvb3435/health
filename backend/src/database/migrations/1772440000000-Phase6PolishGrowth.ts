import { MigrationInterface, QueryRunner } from "typeorm";

export class Phase6PolishGrowth1772440000000 implements MigrationInterface {
    name = 'Phase6PolishGrowth1772440000000'

    public async up(queryRunner: QueryRunner): Promise<void> {
        // 1. Create onboarding_progress table
        await queryRunner.query(`
            CREATE TABLE IF NOT EXISTS "onboarding_progress" (
                "id" uuid NOT NULL DEFAULT gen_random_uuid(),
                "organization_id" uuid NOT NULL,
                "current_step" integer NOT NULL DEFAULT 1,
                "completed_steps" jsonb NOT NULL DEFAULT '[]',
                "is_completed" boolean NOT NULL DEFAULT false,
                "metadata" jsonb,
                "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
                "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
                CONSTRAINT "PK_onboarding_progress" PRIMARY KEY ("id"),
                CONSTRAINT "FK_onboarding_progress_organization" FOREIGN KEY ("organization_id")
                    REFERENCES "organizations"("id") ON DELETE CASCADE
            )
        `);

        await queryRunner.query(`
            CREATE UNIQUE INDEX IF NOT EXISTS "IDX_onboarding_progress_org"
                ON "onboarding_progress"("organization_id")
        `);

        // 2. Create notifications table
        await queryRunner.query(`
            CREATE TABLE IF NOT EXISTS "notifications" (
                "id" uuid NOT NULL DEFAULT gen_random_uuid(),
                "organization_id" uuid NOT NULL,
                "user_id" uuid,
                "type" character varying(50) NOT NULL,
                "title" character varying(255) NOT NULL,
                "message" text NOT NULL,
                "data" jsonb,
                "is_read" boolean NOT NULL DEFAULT false,
                "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
                CONSTRAINT "PK_notifications" PRIMARY KEY ("id"),
                CONSTRAINT "FK_notifications_organization" FOREIGN KEY ("organization_id")
                    REFERENCES "organizations"("id") ON DELETE CASCADE,
                CONSTRAINT "FK_notifications_user" FOREIGN KEY ("user_id")
                    REFERENCES "users"("id") ON DELETE SET NULL
            )
        `);

        await queryRunner.query(`
            CREATE INDEX IF NOT EXISTS "IDX_notifications_org_read_date"
                ON "notifications"("organization_id", "is_read", "created_at" DESC)
        `);

        await queryRunner.query(`
            CREATE INDEX IF NOT EXISTS "IDX_notifications_user_read"
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
        await queryRunner.query(`DROP INDEX IF EXISTS "IDX_notifications_user_read"`);
        await queryRunner.query(`DROP INDEX IF EXISTS "IDX_notifications_org_read_date"`);
        await queryRunner.query(`DROP TABLE IF EXISTS "notifications"`);
        await queryRunner.query(`DROP INDEX IF EXISTS "IDX_onboarding_progress_org"`);
        await queryRunner.query(`DROP TABLE IF EXISTS "onboarding_progress"`);
    }
}
