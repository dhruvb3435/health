import { MigrationInterface, QueryRunner } from "typeorm";

export class Phase2PatientRefactor1772309743165 implements MigrationInterface {
    name = 'Phase2PatientRefactor1772309743165'

    public async up(queryRunner: QueryRunner): Promise<void> {
        // The constraints and indexes below may have already been dropped by TypeORM auto-sync
        // in a previous session. Because Postgres aborts the entire transaction when a drop fails,
        // we omit them from this migration.
        /*
        const dropConstraints = [
            \`ALTER TABLE "roles" DROP CONSTRAINT "FK_roles_organizationId"\`,
            \`ALTER TABLE "role_permissions" DROP CONSTRAINT "FK_role_permissions_roleId"\`,
            \`ALTER TABLE "role_permissions" DROP CONSTRAINT "FK_role_permissions_permissionId"\`,
            \`ALTER TABLE "user_roles" DROP CONSTRAINT "FK_user_roles_userId"\`,
            \`ALTER TABLE "user_roles" DROP CONSTRAINT "FK_user_roles_roleId"\`,
        ];

        for (const query of dropConstraints) {
            try {
                await queryRunner.query(query);
            } catch (e) {
                console.log(\`Note: Constraint already dropped or missing. Skipping...\`);
            }
        }

        await queryRunner.query(\`DROP INDEX IF EXISTS "public"."IDX_70d767dd389dc8898495b98cb3"\`);
        await queryRunner.query(\`DROP INDEX IF EXISTS "public"."IDX_71a44365fee48a26ed5c8ce9ac"\`);
        await queryRunner.query(\`DROP INDEX IF EXISTS "public"."IDX_c6a3cf4a1af43da18ff88cda6a"\`);
        */
        await queryRunner.query(`ALTER TABLE "users" RENAME COLUMN "roles" TO "organizationId"`);
        await queryRunner.query(`ALTER TYPE "public"."users_roles_enum" RENAME TO "users_organizationid_enum"`);
        await queryRunner.query(`ALTER TABLE "prescriptions" ADD "organizationId" uuid NOT NULL`);
        await queryRunner.query(`ALTER TABLE "doctors" ADD "organizationId" uuid NOT NULL`);
        await queryRunner.query(`ALTER TABLE "appointments" ADD "organizationId" uuid NOT NULL`);
        await queryRunner.query(`ALTER TABLE "medical_records" ADD "organizationId" uuid NOT NULL`);
        await queryRunner.query(`ALTER TABLE "patients" ADD "organizationId" uuid NOT NULL`);
        await queryRunner.query(`ALTER TABLE "invoices" ADD "organizationId" uuid NOT NULL`);
        await queryRunner.query(`ALTER TABLE "lab_tests" ADD "organizationId" uuid NOT NULL`);
        await queryRunner.query(`ALTER TABLE "medicines" ADD "organizationId" uuid NOT NULL`);
        await queryRunner.query(`ALTER TABLE "staff" ADD "organizationId" uuid NOT NULL`);
        await queryRunner.query(`ALTER TABLE "inventory" ADD "organizationId" uuid NOT NULL`);
        await queryRunner.query(`ALTER TABLE "wards" ADD "organizationId" uuid NOT NULL`);
        await queryRunner.query(`ALTER TABLE "beds" ADD "organizationId" uuid NOT NULL`);
        await queryRunner.query(`ALTER TABLE "admissions" ADD "organizationId" uuid NOT NULL`);
        await queryRunner.query(`ALTER TABLE "operation_theaters" ADD "organizationId" uuid NOT NULL`);
        await queryRunner.query(`ALTER TABLE "surgeries" ADD "organizationId" uuid NOT NULL`);
        await queryRunner.query(`ALTER TABLE "radiology_requests" ADD "organizationId" uuid NOT NULL`);
        await queryRunner.query(`ALTER TABLE "expenses" ADD "organizationId" uuid NOT NULL`);
        await queryRunner.query(`ALTER TABLE "revenue" ADD "organizationId" uuid NOT NULL`);
        await queryRunner.query(`ALTER TABLE "compliance_records" ADD "organizationId" uuid NOT NULL`);
        await queryRunner.query(`ALTER TABLE "data_access_logs" ADD "organizationId" uuid NOT NULL`);
        await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "organizationId"`);
        await queryRunner.query(`ALTER TABLE "users" ADD "organizationId" uuid NOT NULL`);
        await queryRunner.query(`CREATE INDEX "IDX_f3d6aea8fcca58182b2e80ce97" ON "users" ("organizationId") `);
        await queryRunner.query(`CREATE INDEX "IDX_a3e65dd6af5a6af30ef17478d7" ON "prescriptions" ("organizationId") `);
        await queryRunner.query(`CREATE INDEX "IDX_7db883970d2add394bb8bf3aa2" ON "doctors" ("organizationId") `);
        await queryRunner.query(`CREATE INDEX "IDX_026120c5a09e838684162cec01" ON "appointments" ("organizationId") `);
        await queryRunner.query(`CREATE INDEX "IDX_b6b420264b4e72be96240b419f" ON "medical_records" ("organizationId") `);
        await queryRunner.query(`CREATE INDEX "IDX_976f324a1a35c5b57fbe1539b5" ON "patients" ("organizationId") `);
        await queryRunner.query(`CREATE INDEX "IDX_ec3509129bb8be820c7b038880" ON "patients" ("organizationId", "bloodType") `);
        await queryRunner.query(`CREATE INDEX "IDX_0ecb33b17d70361bf06a796e46" ON "patients" ("organizationId", "createdAt") `);
        await queryRunner.query(`CREATE INDEX "IDX_456200d0e5c0e0767ea6a01171" ON "patients" ("organizationId", "custom_user_id") `);
        await queryRunner.query(`CREATE INDEX "IDX_6a310c242c9f4bf25ea4b3c983" ON "patients" ("organizationId", "id") `);
        await queryRunner.query(`CREATE INDEX "IDX_4237f4b816fec1df81bd85f833" ON "invoices" ("organizationId") `);
        await queryRunner.query(`CREATE INDEX "IDX_2f74c98ce3f02d4be4da604021" ON "lab_tests" ("organizationId") `);
        await queryRunner.query(`CREATE INDEX "IDX_e9724556b8556b4194b92aa000" ON "medicines" ("organizationId") `);
        await queryRunner.query(`CREATE INDEX "IDX_631e1070052326ebfa36816e41" ON "staff" ("organizationId") `);
        await queryRunner.query(`CREATE INDEX "IDX_c5528f0a4e1b574c467829a14b" ON "inventory" ("organizationId") `);
        await queryRunner.query(`CREATE INDEX "IDX_5396865e92b4c7f2e402e62618" ON "wards" ("organizationId") `);
        await queryRunner.query(`CREATE INDEX "IDX_989e4fbaeaecc8e84bfe314931" ON "beds" ("organizationId") `);
        await queryRunner.query(`CREATE INDEX "IDX_36ad042a35faab35449b812175" ON "admissions" ("organizationId") `);
        await queryRunner.query(`CREATE INDEX "IDX_b18df2568e519a90690b958e73" ON "operation_theaters" ("organizationId") `);
        await queryRunner.query(`CREATE INDEX "IDX_c88f197f6830095e83ca22a971" ON "surgeries" ("organizationId") `);
        await queryRunner.query(`CREATE INDEX "IDX_27ad38bd17ccbe26b92fad9c4a" ON "radiology_requests" ("organizationId") `);
        await queryRunner.query(`CREATE INDEX "IDX_bf144dfd64fba8948ffb30d6e3" ON "expenses" ("organizationId") `);
        await queryRunner.query(`CREATE INDEX "IDX_9043bb972fb118239fee29bea7" ON "revenue" ("organizationId") `);
        await queryRunner.query(`CREATE INDEX "IDX_7ec1ba02faf898333445dde943" ON "compliance_records" ("organizationId") `);
        await queryRunner.query(`CREATE INDEX "IDX_cb296af1db6e1bee53394143ee" ON "data_access_logs" ("organizationId") `);
        await queryRunner.query(`ALTER TABLE "roles" ADD CONSTRAINT "FK_0933e1dfb2993d672af1a98f08e" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "users" ADD CONSTRAINT "FK_f3d6aea8fcca58182b2e80ce979" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "prescriptions" ADD CONSTRAINT "FK_a3e65dd6af5a6af30ef17478d79" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "doctors" ADD CONSTRAINT "FK_7db883970d2add394bb8bf3aa2e" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "appointments" ADD CONSTRAINT "FK_026120c5a09e838684162cec01b" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "medical_records" ADD CONSTRAINT "FK_b6b420264b4e72be96240b419f7" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "patients" ADD CONSTRAINT "FK_976f324a1a35c5b57fbe1539b50" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "invoices" ADD CONSTRAINT "FK_4237f4b816fec1df81bd85f833f" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "lab_tests" ADD CONSTRAINT "FK_2f74c98ce3f02d4be4da604021b" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "medicines" ADD CONSTRAINT "FK_e9724556b8556b4194b92aa0006" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "staff" ADD CONSTRAINT "FK_631e1070052326ebfa36816e412" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "inventory" ADD CONSTRAINT "FK_c5528f0a4e1b574c467829a14b1" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "wards" ADD CONSTRAINT "FK_5396865e92b4c7f2e402e62618e" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "beds" ADD CONSTRAINT "FK_989e4fbaeaecc8e84bfe3149319" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "admissions" ADD CONSTRAINT "FK_36ad042a35faab35449b8121757" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "operation_theaters" ADD CONSTRAINT "FK_b18df2568e519a90690b958e73a" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "surgeries" ADD CONSTRAINT "FK_c88f197f6830095e83ca22a9710" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "radiology_requests" ADD CONSTRAINT "FK_27ad38bd17ccbe26b92fad9c4a2" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "expenses" ADD CONSTRAINT "FK_bf144dfd64fba8948ffb30d6e3d" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "revenue" ADD CONSTRAINT "FK_9043bb972fb118239fee29bea7d" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "compliance_records" ADD CONSTRAINT "FK_7ec1ba02faf898333445dde9436" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "data_access_logs" ADD CONSTRAINT "FK_cb296af1db6e1bee53394143ee3" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "role_permissions" ADD CONSTRAINT "FK_178199805b901ccd220ab7740ec" FOREIGN KEY ("role_id") REFERENCES "roles"("id") ON DELETE CASCADE ON UPDATE CASCADE`);
        await queryRunner.query(`ALTER TABLE "role_permissions" ADD CONSTRAINT "FK_17022daf3f885f7d35423e9971e" FOREIGN KEY ("permission_id") REFERENCES "permissions"("id") ON DELETE CASCADE ON UPDATE CASCADE`);
        await queryRunner.query(`ALTER TABLE "user_roles" ADD CONSTRAINT "FK_87b8888186ca9769c960e926870" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE`);
        await queryRunner.query(`ALTER TABLE "user_roles" ADD CONSTRAINT "FK_b23c65e50a758245a33ee35fda1" FOREIGN KEY ("role_id") REFERENCES "roles"("id") ON DELETE CASCADE ON UPDATE CASCADE`);
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
        await queryRunner.query(`DROP INDEX "public"."IDX_6a310c242c9f4bf25ea4b3c983"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_456200d0e5c0e0767ea6a01171"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_0ecb33b17d70361bf06a796e46"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_ec3509129bb8be820c7b038880"`);
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
        await queryRunner.query(`ALTER TYPE "public"."users_organizationid_enum" RENAME TO "users_roles_enum"`);
        await queryRunner.query(`ALTER TABLE "users" RENAME COLUMN "organizationId" TO "roles"`);
        await queryRunner.query(`CREATE INDEX "IDX_c6a3cf4a1af43da18ff88cda6a" ON "patients" ("custom_user_id") `);
        await queryRunner.query(`CREATE INDEX "IDX_71a44365fee48a26ed5c8ce9ac" ON "patients" ("bloodType") `);
        await queryRunner.query(`CREATE INDEX "IDX_70d767dd389dc8898495b98cb3" ON "patients" ("createdAt") `);
        await queryRunner.query(`ALTER TABLE "user_roles" ADD CONSTRAINT "FK_user_roles_roleId" FOREIGN KEY ("role_id") REFERENCES "roles"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "user_roles" ADD CONSTRAINT "FK_user_roles_userId" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "role_permissions" ADD CONSTRAINT "FK_role_permissions_permissionId" FOREIGN KEY ("permission_id") REFERENCES "permissions"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "role_permissions" ADD CONSTRAINT "FK_role_permissions_roleId" FOREIGN KEY ("role_id") REFERENCES "roles"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "roles" ADD CONSTRAINT "FK_roles_organizationId" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
    }

}
