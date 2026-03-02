/**
 * Emergency patch: Adds organizationId to any table that is missing it.
 * Safe to run multiple times (IDEMPOTENT).
 */
import 'reflect-metadata';
import * as path from 'path';
import * as dotenv from 'dotenv';
dotenv.config({ path: path.resolve(__dirname, '../../../.env') });

async function patch() {
    const { AppDataSource } = await import('../typeorm.config');

    if (!AppDataSource.isInitialized) {
        await AppDataSource.initialize();
    }

    const q = AppDataSource.query.bind(AppDataSource);

    // Fetch the default org id
    const orgs = await q(`SELECT id FROM organizations WHERE slug = 'aarogentix-health' LIMIT 1`);
    if (!orgs.length) {
        console.error('❌ Default organization not found! Run seed-production-data first.');
        process.exit(1);
    }
    const orgId = orgs[0].id;
    console.log(`✅ Using default org: ${orgId}`);

    // All tables that need organizationId
    const tables = [
        'prescriptions', 'doctors', 'appointments', 'medical_records', 'patients',
        'invoices', 'lab_tests', 'medicines', 'staff', 'inventory', 'wards', 'beds',
        'admissions', 'operation_theaters', 'surgeries', 'radiology_requests',
        'expenses', 'revenue', 'compliance_records', 'data_access_logs',
    ];

    for (const table of tables) {
        // Check if column already exists
        const colCheck = await q(
            `SELECT 1 FROM information_schema.columns
       WHERE table_name = $1 AND column_name = 'organizationId'`,
            [table]
        );

        if (!colCheck.length) {
            console.log(`➕ Adding organizationId to ${table}...`);
            await q(`ALTER TABLE "${table}" ADD "organizationId" uuid`);
        } else {
            console.log(`✓  ${table} already has organizationId`);
        }

        // Backfill nulls
        await q(`UPDATE "${table}" SET "organizationId" = $1 WHERE "organizationId" IS NULL`, [orgId]);

        // Ensure NOT NULL
        try {
            await q(`ALTER TABLE "${table}" ALTER COLUMN "organizationId" SET NOT NULL`);
        } catch {
            // Already NOT NULL, ignore
        }

        // FK (ignore if already exists)
        try {
            await q(
                `ALTER TABLE "${table}" ADD CONSTRAINT "FK_${table}_organizationId"
         FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE CASCADE`
            );
        } catch {
            // Already exists
        }
    }

    // Handle users table
    const userColCheck = await q(
        `SELECT 1 FROM information_schema.columns
     WHERE table_name = 'users' AND column_name = 'organizationId'`
    );
    if (!userColCheck.length) {
        console.log(`➕ Adding organizationId to users...`);
        await q(`ALTER TABLE "users" ADD "organizationId" uuid`);
    } else {
        console.log(`✓  users already has organizationId`);
    }

    await q(`UPDATE "users" SET "organizationId" = $1 WHERE "organizationId" IS NULL`, [orgId]);
    try {
        await q(`ALTER TABLE "users" ALTER COLUMN "organizationId" SET NOT NULL`);
    } catch { /* already NOT NULL */ }
    try {
        await q(
            `ALTER TABLE "users" ADD CONSTRAINT "FK_users_organizationId"
       FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE CASCADE`
        );
    } catch { /* already exists */ }

    console.log('\n✨ Patch complete! All tables now have organizationId.\n');
    process.exit(0);
}

patch().catch((err) => {
    console.error('❌ Patch failed:', err.message);
    process.exit(1);
});
