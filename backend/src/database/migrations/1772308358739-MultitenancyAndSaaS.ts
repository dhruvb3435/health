import { MigrationInterface, QueryRunner } from "typeorm";

export class MultitenancyAndSaaS1772308358739 implements MigrationInterface {
    name = 'MultitenancyAndSaaS1772308358739'

    public async up(queryRunner: QueryRunner): Promise<void> {
        // 1. Ensure uuid extension exists
        await queryRunner.query(`CREATE EXTENSION IF NOT EXISTS "uuid-ossp"`);

        // 2. Create Organizations Table first
        await queryRunner.query(`CREATE TYPE "public"."organizations_subscriptionplan_enum" AS ENUM('basic', 'premium', 'enterprise')`);
        await queryRunner.query(`CREATE TYPE "public"."organizations_status_enum" AS ENUM('active', 'suspended', 'pending')`);
        await queryRunner.query(`CREATE TABLE "organizations" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "name" character varying NOT NULL, "slug" character varying NOT NULL, "logoUrl" character varying, "subscriptionPlan" "public"."organizations_subscriptionplan_enum" NOT NULL DEFAULT 'basic', "status" "public"."organizations_status_enum" NOT NULL DEFAULT 'pending', "settings" jsonb, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), "deletedAt" TIMESTAMP, CONSTRAINT "UQ_963693341bd612aa01ddf3a4b68" UNIQUE ("slug"), CONSTRAINT "PK_6b031fcd0863e3f6b44230163f9" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "IDX_963693341bd612aa01ddf3a4b6" ON "organizations" ("slug") `);

        // 3. Insert Default Organization
        const defaultOrgResult = await queryRunner.query(`INSERT INTO "organizations" ("name", "slug", "status", "subscriptionPlan") VALUES ('Aarogentix Health', 'aarogentix-health', 'active', 'enterprise') RETURNING id`);
        const defaultOrgId = defaultOrgResult[0].id;

        // 4. Create RBAC Tables
        await queryRunner.query(`CREATE TABLE "permissions" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "name" character varying NOT NULL, "description" character varying, "category" character varying NOT NULL, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "UQ_48ce552495d14eae9b187bb6716" UNIQUE ("name"), CONSTRAINT "PK_920331560282b8bd21bb02290df" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "roles" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "name" character varying NOT NULL, "description" character varying, "organizationId" uuid NOT NULL, "isSystemRole" boolean NOT NULL DEFAULT false, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_c1433d71a4838793a49dcad46ab" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE UNIQUE INDEX "IDX_d27a5e69fb41256abed347a85e" ON "roles" ("organizationId", "name") `);
        await queryRunner.query(`CREATE TABLE "role_permissions" ("role_id" uuid NOT NULL, "permission_id" uuid NOT NULL, CONSTRAINT "PK_25d24010f53bb80b78e412c9656" PRIMARY KEY ("role_id", "permission_id"))`);
        await queryRunner.query(`CREATE INDEX "IDX_178199805b901ccd220ab7740e" ON "role_permissions" ("role_id") `);
        await queryRunner.query(`CREATE INDEX "IDX_17022daf3f885f7d35423e9971" ON "role_permissions" ("permission_id") `);
        await queryRunner.query(`CREATE TABLE "user_roles" ("user_id" uuid NOT NULL, "role_id" uuid NOT NULL, CONSTRAINT "PK_23ed6f04fe43066df08379fd034" PRIMARY KEY ("user_id", "role_id"))`);
        await queryRunner.query(`CREATE INDEX "IDX_87b8888186ca9769c960e92687" ON "user_roles" ("user_id") `);
        await queryRunner.query(`CREATE INDEX "IDX_b23c65e50a758245a33ee35fda" ON "user_roles" ("role_id") `);

        // 5. Add organizationId as NULLABLE first to all clinical/admin tables
        const tables = [
            'prescriptions', 'doctors', 'appointments', 'medical_records', 'patients', 'invoices',
            'lab_tests', 'medicines', 'staff', 'inventory', 'wards', 'beds', 'admissions',
            'operation_theaters', 'surgeries', 'radiology_requests', 'expenses', 'revenue',
            'compliance_records', 'data_access_logs'
        ];

        for (const table of tables) {
            await queryRunner.query(`ALTER TABLE "${table}" ADD "organizationId" uuid`);
            // Set default org for existing rows
            await queryRunner.query(`UPDATE "${table}" SET "organizationId" = '${defaultOrgId}' WHERE "organizationId" IS NULL`);
            // Set NOT NULL
            await queryRunner.query(`ALTER TABLE "${table}" ALTER COLUMN "organizationId" SET NOT NULL`);
            // Add Index
            await queryRunner.query(`CREATE INDEX "IDX_${table}_organizationId" ON "${table}" ("organizationId")`);
            // Add FK
            await queryRunner.query(`ALTER TABLE "${table}" ADD CONSTRAINT "FK_${table}_organizationId" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE CASCADE`);
        }

        // 6. Handle Users table separately (it has 'roles' column which we need to preserve data from IF needed, but here we just add organizationId)
        await queryRunner.query(`ALTER TABLE "users" ADD "organizationId" uuid`);
        await queryRunner.query(`UPDATE "users" SET "organizationId" = '${defaultOrgId}' WHERE "organizationId" IS NULL`);
        await queryRunner.query(`ALTER TABLE "users" ALTER COLUMN "organizationId" SET NOT NULL`);
        await queryRunner.query(`CREATE INDEX "IDX_users_organizationId" ON "users" ("organizationId")`);
        await queryRunner.query(`ALTER TABLE "users" ADD CONSTRAINT "FK_users_organizationId" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE CASCADE`);

        // 7. Cleanup users.roles (if it was an enum array, we keep it for now but the entity uses many-to-many roles table. 
        // The entity now has @ManyToMany(() => Role) roles: Role[];
        // So we keep the 'roles' column for now or drop it if we migrate data. 
        // For simplicity, let's just drop the old 'roles' column and its enum.
        await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "roles"`);
        await queryRunner.query(`DROP TYPE IF EXISTS "public"."users_roles_enum"`);

        // Add FKs for RBAC tables
        await queryRunner.query(`ALTER TABLE "roles" ADD CONSTRAINT "FK_roles_organizationId" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE CASCADE`);
        await queryRunner.query(`ALTER TABLE "role_permissions" ADD CONSTRAINT "FK_role_permissions_roleId" FOREIGN KEY ("role_id") REFERENCES "roles"("id") ON DELETE CASCADE`);
        await queryRunner.query(`ALTER TABLE "role_permissions" ADD CONSTRAINT "FK_role_permissions_permissionId" FOREIGN KEY ("permission_id") REFERENCES "permissions"("id") ON DELETE CASCADE`);
        await queryRunner.query(`ALTER TABLE "user_roles" ADD CONSTRAINT "FK_user_roles_userId" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE`);
        await queryRunner.query(`ALTER TABLE "user_roles" ADD CONSTRAINT "FK_user_roles_roleId" FOREIGN KEY ("role_id") REFERENCES "roles"("id") ON DELETE CASCADE`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "user_roles" DROP CONSTRAINT "FK_b23c65e50a758245a33ee35fda1"`);
        await queryRunner.query(`ALTER TABLE "user_roles" DROP CONSTRAINT "FK_87b8888186ca9769c960e926870"`);
        await queryRunner.query(`ALTER TABLE "role_permissions" DROP CONSTRAINT "FK_17022daf3f885f7d35423e9971e"`);
        await queryRunner.query(`ALTER TABLE "role_permissions" DROP CONSTRAINT "FK_178199805b901ccd220ab7740ec"`);
        await queryRunner.query(`ALTER TABLE "data_access_logs" DROP CONSTRAINT "FK_cb296af1db6e1bee53394143ee3"`);
        await queryRunner.query(`ALTER TABLE "compliance_records" DROP CONSTRAINT "FK_7ec1ba02faf898333445dde9436"`);
        await queryRunner.query(`ALTER TABLE "revenue" DROP CONSTRAINT "FK_9043bb972fb118239fee29bea7d"`);
        await queryRunner.query(`ALTER TABLE "expenses" DROP CONSTRAINT "FK_bf144dfd64fba8948ffb30d6e3d"`);
        await queryRunner.query(`ALTER TABLE "radiology_requests" DROP CONSTRAINT "FK_27ad38bd17ccbe26b92fad9c4a2"`);
        await queryRunner.query(`ALTER TABLE "surgeries" DROP CONSTRAINT "FK_c88f197f6830095e83ca22a9710"`);
        await queryRunner.query(`ALTER TABLE "operation_theaters" DROP CONSTRAINT "FK_b18df2568e519a90690b958e73a"`);
        await queryRunner.query(`ALTER TABLE "admissions" DROP CONSTRAINT "FK_36ad042a35faab35449b8121757"`);
        await queryRunner.query(`ALTER TABLE "beds" DROP CONSTRAINT "FK_989e4fbaeaecc8e84bfe3149319"`);
        await queryRunner.query(`ALTER TABLE "wards" DROP CONSTRAINT "FK_5396865e92b4c7f2e402e62618e"`);
        await queryRunner.query(`ALTER TABLE "inventory" DROP CONSTRAINT "FK_c5528f0a4e1b574c467829a14b1"`);
        await queryRunner.query(`ALTER TABLE "staff" DROP CONSTRAINT "FK_631e1070052326ebfa36816e412"`);
        await queryRunner.query(`ALTER TABLE "medicines" DROP CONSTRAINT "FK_e9724556b8556b4194b92aa0006"`);
        await queryRunner.query(`ALTER TABLE "lab_tests" DROP CONSTRAINT "FK_2f74c98ce3f02d4be4da604021b"`);
        await queryRunner.query(`ALTER TABLE "invoices" DROP CONSTRAINT "FK_4237f4b816fec1df81bd85f833f"`);
        await queryRunner.query(`ALTER TABLE "patients" DROP CONSTRAINT "FK_976f324a1a35c5b57fbe1539b50"`);
        await queryRunner.query(`ALTER TABLE "medical_records" DROP CONSTRAINT "FK_b6b420264b4e72be96240b419f7"`);
        await queryRunner.query(`ALTER TABLE "appointments" DROP CONSTRAINT "FK_026120c5a09e838684162cec01b"`);
        await queryRunner.query(`ALTER TABLE "doctors" DROP CONSTRAINT "FK_7db883970d2add394bb8bf3aa2e"`);
        await queryRunner.query(`ALTER TABLE "prescriptions" DROP CONSTRAINT "FK_a3e65dd6af5a6af30ef17478d79"`);
        await queryRunner.query(`ALTER TABLE "users" DROP CONSTRAINT "FK_f3d6aea8fcca58182b2e80ce979"`);
        await queryRunner.query(`ALTER TABLE "roles" DROP CONSTRAINT "FK_0933e1dfb2993d672af1a98f08e"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_cb296af1db6e1bee53394143ee"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_7ec1ba02faf898333445dde943"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_9043bb972fb118239fee29bea7"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_bf144dfd64fba8948ffb30d6e3"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_27ad38bd17ccbe26b92fad9c4a"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_c88f197f6830095e83ca22a971"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_b18df2568e519a90690b958e73"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_36ad042a35faab35449b812175"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_989e4fbaeaecc8e84bfe314931"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_5396865e92b4c7f2e402e62618"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_c5528f0a4e1b574c467829a14b"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_631e1070052326ebfa36816e41"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_e9724556b8556b4194b92aa000"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_2f74c98ce3f02d4be4da604021"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_4237f4b816fec1df81bd85f833"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_976f324a1a35c5b57fbe1539b5"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_b6b420264b4e72be96240b419f"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_026120c5a09e838684162cec01"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_7db883970d2add394bb8bf3aa2"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_a3e65dd6af5a6af30ef17478d7"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_f3d6aea8fcca58182b2e80ce97"`);
        await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "organizationId"`);
        await queryRunner.query(`ALTER TABLE "users" ADD "organizationId" "public"."users_organizationid_enum" array NOT NULL DEFAULT '{patient}'`);
        await queryRunner.query(`ALTER TABLE "data_access_logs" DROP COLUMN "organizationId"`);
        await queryRunner.query(`ALTER TABLE "compliance_records" DROP COLUMN "organizationId"`);
        await queryRunner.query(`ALTER TABLE "revenue" DROP COLUMN "organizationId"`);
        await queryRunner.query(`ALTER TABLE "expenses" DROP COLUMN "organizationId"`);
        await queryRunner.query(`ALTER TABLE "radiology_requests" DROP COLUMN "organizationId"`);
        await queryRunner.query(`ALTER TABLE "surgeries" DROP COLUMN "organizationId"`);
        await queryRunner.query(`ALTER TABLE "operation_theaters" DROP COLUMN "organizationId"`);
        await queryRunner.query(`ALTER TABLE "admissions" DROP COLUMN "organizationId"`);
        await queryRunner.query(`ALTER TABLE "beds" DROP COLUMN "organizationId"`);
        await queryRunner.query(`ALTER TABLE "wards" DROP COLUMN "organizationId"`);
        await queryRunner.query(`ALTER TABLE "inventory" DROP COLUMN "organizationId"`);
        await queryRunner.query(`ALTER TABLE "staff" DROP COLUMN "organizationId"`);
        await queryRunner.query(`ALTER TABLE "medicines" DROP COLUMN "organizationId"`);
        await queryRunner.query(`ALTER TABLE "lab_tests" DROP COLUMN "organizationId"`);
        await queryRunner.query(`ALTER TABLE "invoices" DROP COLUMN "organizationId"`);
        await queryRunner.query(`ALTER TABLE "patients" DROP COLUMN "organizationId"`);
        await queryRunner.query(`ALTER TABLE "medical_records" DROP COLUMN "organizationId"`);
        await queryRunner.query(`ALTER TABLE "appointments" DROP COLUMN "organizationId"`);
        await queryRunner.query(`ALTER TABLE "doctors" DROP COLUMN "organizationId"`);
        await queryRunner.query(`ALTER TABLE "prescriptions" DROP COLUMN "organizationId"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_b23c65e50a758245a33ee35fda"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_87b8888186ca9769c960e92687"`);
        await queryRunner.query(`DROP TABLE "user_roles"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_17022daf3f885f7d35423e9971"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_178199805b901ccd220ab7740e"`);
        await queryRunner.query(`DROP TABLE "role_permissions"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_d27a5e69fb41256abed347a85e"`);
        await queryRunner.query(`DROP TABLE "roles"`);
        await queryRunner.query(`DROP TABLE "permissions"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_963693341bd612aa01ddf3a4b6"`);
        await queryRunner.query(`DROP TABLE "organizations"`);
        await queryRunner.query(`DROP TYPE "public"."organizations_status_enum"`);
        await queryRunner.query(`DROP TYPE "public"."organizations_subscriptionplan_enum"`);
        await queryRunner.query(`ALTER TYPE "public"."users_organizationid_enum" RENAME TO "users_roles_enum"`);
        await queryRunner.query(`ALTER TABLE "users" RENAME COLUMN "organizationId" TO "roles"`);
    }

}
