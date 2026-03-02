import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * AddCompositeIndexesForTenantedEntities1772420000000
 *
 * Adds composite indexes on the 4 core business entities for multi-tenant
 * query performance. All indexes use IF NOT EXISTS to be idempotent-safe
 * across environments (dev, staging, prod re-runs).
 *
 * Tables covered:
 *  - patients       → (organization_id, created_at), (organization_id, status)
 *  - appointments   → (organization_id, created_at), (organization_id, status)
 *  - doctors        → (organization_id, created_at), (organization_id, status)
 *  - audit_logs     → (organization_id, created_at) [already via entity decorator],
 *                     (organization_id, action)     [in place of status — audit_logs has no status col]
 *
 * Safety:
 *  - All CREATE statements use IF NOT EXISTS — safe to re-run.
 *  - down() uses DROP INDEX IF EXISTS — safe to re-run.
 *  - No table structure changes; zero downtime risk.
 */
export class AddCompositeIndexesForTenantedEntities1772420000000 implements MigrationInterface {
    public name = 'AddCompositeIndexesForTenantedEntities1772420000000';

    public async up(queryRunner: QueryRunner): Promise<void> {
        // ── patients ──────────────────────────────────────────────────────────
        await queryRunner.query(`
            CREATE INDEX IF NOT EXISTS "IDX_patients_org_created_at"
            ON "patients" ("organizationId", "createdAt")
        `);
        await queryRunner.query(`
            CREATE INDEX IF NOT EXISTS "IDX_patients_org_status"
            ON "patients" ("organizationId", "status")
        `);

        // ── appointments ──────────────────────────────────────────────────────
        await queryRunner.query(`
            CREATE INDEX IF NOT EXISTS "IDX_appointments_org_created_at"
            ON "appointments" ("organizationId", "createdAt")
        `);
        await queryRunner.query(`
            CREATE INDEX IF NOT EXISTS "IDX_appointments_org_status"
            ON "appointments" ("organizationId", "status")
        `);

        // ── doctors ───────────────────────────────────────────────────────────
        await queryRunner.query(`
            CREATE INDEX IF NOT EXISTS "IDX_doctors_org_created_at"
            ON "doctors" ("organizationId", "createdAt")
        `);
        await queryRunner.query(`
            CREATE INDEX IF NOT EXISTS "IDX_doctors_org_status"
            ON "doctors" ("organizationId", "status")
        `);

        // ── audit_logs ────────────────────────────────────────────────────────
        // (organizationId, createdAt) is already declared via TypeORM @Index
        // decorator on the entity. We still add it here with IF NOT EXISTS so
        // this migration is self-contained and safe to apply against a blank DB.
        await queryRunner.query(`
            CREATE INDEX IF NOT EXISTS "IDX_audit_logs_org_created_at"
            ON "audit_logs" ("organizationId", "createdAt")
        `);
        // audit_logs has no "status" column — use "action" (the audit event type enum)
        // which is the semantically equivalent filtering column for audit queries.
        await queryRunner.query(`
            CREATE INDEX IF NOT EXISTS "IDX_audit_logs_org_action"
            ON "audit_logs" ("organizationId", "action")
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP INDEX IF EXISTS "public"."IDX_audit_logs_org_action"`);
        await queryRunner.query(`DROP INDEX IF EXISTS "public"."IDX_audit_logs_org_created_at"`);
        await queryRunner.query(`DROP INDEX IF EXISTS "public"."IDX_doctors_org_status"`);
        await queryRunner.query(`DROP INDEX IF EXISTS "public"."IDX_doctors_org_created_at"`);
        await queryRunner.query(`DROP INDEX IF EXISTS "public"."IDX_appointments_org_status"`);
        await queryRunner.query(`DROP INDEX IF EXISTS "public"."IDX_appointments_org_created_at"`);
        await queryRunner.query(`DROP INDEX IF EXISTS "public"."IDX_patients_org_status"`);
        await queryRunner.query(`DROP INDEX IF EXISTS "public"."IDX_patients_org_created_at"`);
    }
}
