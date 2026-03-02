import { MigrationInterface, QueryRunner } from "typeorm";

export class AuditAllEntitiesCompositeIndexes1772379559341 implements MigrationInterface {
    name = 'AuditAllEntitiesCompositeIndexes1772379559341'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE INDEX "IDX_30ee0e442e9fc11f40dd63a30e" ON "users" ("organizationId", "createdAt") `);
        await queryRunner.query(`CREATE INDEX "IDX_ba0fb9c159400a93ab01dc3800" ON "users" ("organizationId", "status") `);
        await queryRunner.query(`CREATE INDEX "IDX_65914a881c83c31787968270fd" ON "prescriptions" ("organizationId", "createdAt") `);
        await queryRunner.query(`CREATE INDEX "IDX_ff01367d20722618c3a60d9d49" ON "prescriptions" ("organizationId", "status") `);
        await queryRunner.query(`CREATE INDEX "IDX_53aa917f6815483658daf9ae77" ON "invoices" ("organizationId", "createdAt") `);
        await queryRunner.query(`CREATE INDEX "IDX_be02e18ec053609bd9e8312cfd" ON "admissions" ("organizationId", "createdAt") `);
        await queryRunner.query(`CREATE INDEX "IDX_26ff6a82a4c8650e19178c0fed" ON "admissions" ("organizationId", "status") `);
        await queryRunner.query(`CREATE INDEX "IDX_ce8f02969cb5d2b76bc3ab4d96" ON "payments" ("organizationId", "createdAt") `);
        await queryRunner.query(`CREATE INDEX "IDX_a65178f0d6f1571c2109b7bbae" ON "payments" ("organizationId", "status") `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP INDEX "public"."IDX_a65178f0d6f1571c2109b7bbae"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_ce8f02969cb5d2b76bc3ab4d96"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_26ff6a82a4c8650e19178c0fed"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_be02e18ec053609bd9e8312cfd"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_53aa917f6815483658daf9ae77"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_ff01367d20722618c3a60d9d49"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_65914a881c83c31787968270fd"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_ba0fb9c159400a93ab01dc3800"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_30ee0e442e9fc11f40dd63a30e"`);
    }

}
