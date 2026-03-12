import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * SeedRbacPermissions1772800000000
 *
 * Seeds all system permissions and 5 system roles for the healthcare platform.
 *
 * Permissions follow the `module:action` naming convention with 5 actions per
 * module: read, create, update, delete, manage (full access).
 *
 * Modules covered (21 total):
 *   patients, doctors, appointments, prescriptions, billing, laboratory,
 *   pharmacy, dashboard, staff, departments, inventory, wards, admissions,
 *   operation-theater, radiology, accounts, compliance, opd-queue,
 *   notifications, settings, rbac
 *
 * System roles (isSystemRole = true, organizationId = NULL):
 *   1. Super Admin        — all permissions
 *   2. Doctor             — clinical read/manage subset
 *   3. Nurse              — ward/admission/patient subset
 *   4. Receptionist       — front-desk subset
 *   5. Lab Technician     — laboratory + patient/doctor read
 *
 * Schema notes:
 *   - roles.organizationId is NOT NULL in the initial schema. This migration
 *     ALTERs the column to nullable so system-level template roles (which are
 *     not tied to any organization) can have organizationId = NULL.
 *   - The FK constraint FK_roles_organizationId is dropped before the ALTER
 *     and re-added as DEFERRABLE so it still enforces referential integrity for
 *     org-scoped roles while allowing NULL for system roles.
 *   - PostgreSQL treats NULL as distinct in unique indexes, so the composite
 *     UNIQUE INDEX on (organizationId, name) continues to work correctly —
 *     two system roles with NULL organizationId but different names do not
 *     conflict.
 *
 * down() removes all seeded data and reverts the schema change.
 */

// ─── Permission catalogue ──────────────────────────────────────────────────────

interface PermissionDef {
    name: string;
    description: string;
    category: string;
}

const ACTIONS = ['read', 'create', 'update', 'delete', 'manage'] as const;
type Action = typeof ACTIONS[number];

const ACTION_DESCRIPTIONS: Record<Action, string> = {
    read:   'View records',
    create: 'Create new records',
    update: 'Edit existing records',
    delete: 'Delete records',
    manage: 'Full access (all operations)',
};

interface ModuleDef {
    slug: string;           // used in permission name, e.g. 'patients'
    category: string;       // human-readable category label
}

const MODULES: ModuleDef[] = [
    { slug: 'patients',           category: 'Patients' },
    { slug: 'doctors',            category: 'Doctors' },
    { slug: 'appointments',       category: 'Appointments' },
    { slug: 'prescriptions',      category: 'Prescriptions' },
    { slug: 'billing',            category: 'Billing' },
    { slug: 'laboratory',         category: 'Laboratory' },
    { slug: 'pharmacy',           category: 'Pharmacy' },
    { slug: 'dashboard',          category: 'Dashboard' },
    { slug: 'staff',              category: 'Staff' },
    { slug: 'departments',        category: 'Departments' },
    { slug: 'inventory',          category: 'Inventory' },
    { slug: 'wards',              category: 'Wards' },
    { slug: 'admissions',         category: 'Admissions' },
    { slug: 'operation-theater',  category: 'Operation Theater' },
    { slug: 'radiology',          category: 'Radiology' },
    { slug: 'accounts',           category: 'Accounts' },
    { slug: 'compliance',         category: 'Compliance' },
    { slug: 'opd-queue',          category: 'OPD Queue' },
    { slug: 'notifications',      category: 'Notifications' },
    { slug: 'settings',           category: 'Settings' },
    { slug: 'rbac',               category: 'RBAC' },
];

function buildPermissions(): PermissionDef[] {
    const perms: PermissionDef[] = [];
    for (const mod of MODULES) {
        for (const action of ACTIONS) {
            perms.push({
                name:        `${mod.slug}:${action}`,
                description: `${ACTION_DESCRIPTIONS[action]} in ${mod.category}`,
                category:    mod.category,
            });
        }
    }
    return perms;
}

// ─── Role → permission mapping ────────────────────────────────────────────────

type PermissionName = string; // `${slug}:${action}`

interface RoleDef {
    name: string;
    description: string;
    permissions: PermissionName[];
}

// Helper: all 5 actions for a module
function all(slug: string): PermissionName[] {
    return ACTIONS.map(a => `${slug}:${a}`);
}

// Helper: specific actions for a module
function only(slug: string, ...actions: Action[]): PermissionName[] {
    return actions.map(a => `${slug}:${a}`);
}

const ALL_PERMISSIONS: PermissionName[] = MODULES.flatMap(m => all(m.slug));

const SYSTEM_ROLES: RoleDef[] = [
    {
        name: 'Super Admin',
        description: 'Unrestricted access to all platform modules and settings',
        permissions: ALL_PERMISSIONS,
    },
    {
        name: 'Doctor',
        description: 'Clinical staff — manages own appointments, prescriptions, and OPD queue; reads patient and diagnostic data',
        permissions: [
            ...only('patients',          'read'),
            ...only('doctors',           'read'),
            ...all('appointments'),
            ...all('prescriptions'),
            ...only('laboratory',        'read'),
            ...only('pharmacy',          'read'),
            ...only('radiology',         'read'),
            ...all('opd-queue'),
            ...only('dashboard',         'read'),
        ],
    },
    {
        name: 'Nurse',
        description: 'Clinical support staff — manages ward and admission workflows; reads patient and clinical data',
        permissions: [
            ...only('patients',          'read'),
            ...only('appointments',      'read'),
            ...only('prescriptions',     'read'),
            ...only('laboratory',        'read'),
            ...all('wards'),
            ...all('admissions'),
            ...only('opd-queue',         'read'),
        ],
    },
    {
        name: 'Receptionist',
        description: 'Front-desk staff — registers patients, manages appointments, handles billing enquiries, and manages the OPD queue',
        permissions: [
            ...only('patients',          'read', 'create'),
            ...all('appointments'),
            ...only('billing',           'read', 'create'),
            ...all('opd-queue'),
            ...only('dashboard',         'read'),
        ],
    },
    {
        name: 'Lab Technician',
        description: 'Laboratory staff — full management of laboratory module; reads patient and doctor data',
        permissions: [
            ...all('laboratory'),
            ...only('patients',          'read'),
            ...only('doctors',           'read'),
        ],
    },
];

// ─── Migration class ──────────────────────────────────────────────────────────

export class SeedRbacPermissions1772800000000 implements MigrationInterface {
    public name = 'SeedRbacPermissions1772800000000';

    public async up(queryRunner: QueryRunner): Promise<void> {

        // ── 1. Make roles.organizationId nullable ──────────────────────────────
        //
        // System roles are not tied to any organization; they serve as
        // templates. The column must allow NULL before we can insert them.
        // We drop the existing NOT NULL constraint (and its FK, which we will
        // restore), then change the column type.

        await queryRunner.query(`
            ALTER TABLE "roles"
            DROP CONSTRAINT IF EXISTS "FK_roles_organizationId"
        `);

        await queryRunner.query(`
            ALTER TABLE "roles"
            ALTER COLUMN "organizationId" DROP NOT NULL
        `);

        // Re-add FK as nullable-safe: only enforce referential integrity when
        // the value is NOT NULL (PostgreSQL FK constraints naturally skip NULL
        // values, so this is the standard way).
        await queryRunner.query(`
            ALTER TABLE "roles"
            ADD CONSTRAINT "FK_roles_organizationId"
            FOREIGN KEY ("organizationId")
            REFERENCES "organizations"("id")
            ON DELETE CASCADE
        `);

        // ── 2. Insert all permissions (idempotent) ─────────────────────────────

        const allPermissions = buildPermissions();

        // Batch insert with ON CONFLICT DO NOTHING so re-running is safe.
        const permRows = allPermissions
            .map(p => `(gen_random_uuid(), '${p.name}', '${p.description}', '${p.category}', NOW(), NOW())`)
            .join(',\n            ');

        await queryRunner.query(`
            INSERT INTO "permissions" ("id", "name", "description", "category", "createdAt", "updatedAt")
            VALUES
            ${permRows}
            ON CONFLICT ("name") DO NOTHING
        `);

        // ── 3. Insert system roles and wire up permissions ─────────────────────

        for (const role of SYSTEM_ROLES) {
            // Insert role if it does not already exist (system roles have
            // organizationId = NULL, so we key on name + isSystemRole).
            await queryRunner.query(`
                INSERT INTO "roles" ("id", "name", "description", "organizationId", "isSystemRole", "createdAt", "updatedAt")
                SELECT
                    gen_random_uuid(),
                    '${role.name}',
                    '${role.description}',
                    NULL,
                    true,
                    NOW(),
                    NOW()
                WHERE NOT EXISTS (
                    SELECT 1 FROM "roles"
                    WHERE "name" = '${role.name}'
                    AND "isSystemRole" = true
                    AND "organizationId" IS NULL
                )
            `);

            // Link the role to its permissions, skipping any that are already
            // linked (idempotent).
            if (role.permissions.length > 0) {
                const permNamesLiteral = role.permissions
                    .map(n => `'${n}'`)
                    .join(', ');

                await queryRunner.query(`
                    INSERT INTO "role_permissions" ("role_id", "permission_id")
                    SELECT r."id", p."id"
                    FROM "roles" r
                    CROSS JOIN "permissions" p
                    WHERE r."name" = '${role.name}'
                    AND r."isSystemRole" = true
                    AND r."organizationId" IS NULL
                    AND p."name" IN (${permNamesLiteral})
                    ON CONFLICT DO NOTHING
                `);
            }
        }
    }

    public async down(queryRunner: QueryRunner): Promise<void> {

        // ── 1. Remove role_permissions links for system roles ──────────────────

        await queryRunner.query(`
            DELETE FROM "role_permissions"
            WHERE "role_id" IN (
                SELECT "id" FROM "roles"
                WHERE "isSystemRole" = true
                AND "organizationId" IS NULL
            )
        `);

        // ── 2. Delete system roles ─────────────────────────────────────────────

        const systemRoleNames = SYSTEM_ROLES.map(r => `'${r.name}'`).join(', ');

        await queryRunner.query(`
            DELETE FROM "roles"
            WHERE "isSystemRole" = true
            AND "organizationId" IS NULL
            AND "name" IN (${systemRoleNames})
        `);

        // ── 3. Delete seeded permissions ───────────────────────────────────────

        const allPermNames = buildPermissions().map(p => `'${p.name}'`).join(',\n            ');

        await queryRunner.query(`
            DELETE FROM "permissions"
            WHERE "name" IN (
                ${allPermNames}
            )
        `);

        // ── 4. Revert roles.organizationId back to NOT NULL ────────────────────
        //
        // This is only safe if no remaining rows have organizationId = NULL
        // after the deletes above. If other system roles were added by other
        // means this step will fail — which is intentional (protect data).

        await queryRunner.query(`
            ALTER TABLE "roles"
            DROP CONSTRAINT IF EXISTS "FK_roles_organizationId"
        `);

        await queryRunner.query(`
            ALTER TABLE "roles"
            ALTER COLUMN "organizationId" SET NOT NULL
        `);

        await queryRunner.query(`
            ALTER TABLE "roles"
            ADD CONSTRAINT "FK_roles_organizationId"
            FOREIGN KEY ("organizationId")
            REFERENCES "organizations"("id")
            ON DELETE CASCADE
        `);
    }
}
