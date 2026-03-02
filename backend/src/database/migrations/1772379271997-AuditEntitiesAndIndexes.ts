import { MigrationInterface, QueryRunner } from "typeorm";

export class AuditEntitiesAndIndexes1772379271997 implements MigrationInterface {
    name = 'AuditEntitiesAndIndexes1772379271997'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP INDEX "public"."IDX_c14d29c69c2fcd936af129d5b8"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_fafcbcfeeedd09f4e4e36a8b93"`);
        await queryRunner.query(`ALTER TABLE "audit_logs" ADD "organizationId" uuid`);
        await queryRunner.query(`DROP INDEX "public"."IDX_cfa83f61e4d27a87fcae1e025a"`);
        await queryRunner.query(`ALTER TABLE "audit_logs" DROP COLUMN "userId"`);
        await queryRunner.query(`ALTER TABLE "audit_logs" ADD "userId" uuid NOT NULL`);
        await queryRunner.query(`CREATE INDEX "IDX_09f6f001b6bc1310462566039f" ON "doctors" ("organizationId", "createdAt") `);
        await queryRunner.query(`CREATE INDEX "IDX_2d031e6155834882f54dcd6b4f" ON "audit_logs" ("organizationId") `);
        await queryRunner.query(`CREATE INDEX "IDX_cfa83f61e4d27a87fcae1e025a" ON "audit_logs" ("userId") `);
        await queryRunner.query(`CREATE INDEX "IDX_eb2d8e058d2b6160818d17acf8" ON "audit_logs" ("organizationId", "userId") `);
        await queryRunner.query(`CREATE INDEX "IDX_9885c0f9a2e4081ebae4313d87" ON "audit_logs" ("organizationId", "createdAt") `);
        await queryRunner.query(`CREATE INDEX "IDX_eeb28b686a8c3472a22d67d239" ON "subscriptions" ("organizationId", "status") `);
        await queryRunner.query(`CREATE INDEX "IDX_b2e47b9a379b4299051bd8f446" ON "organization_usage" ("organization_id") `);
        await queryRunner.query(`CREATE UNIQUE INDEX "IDX_1c202fe5763cff8553fc794c3b" ON "organization_usage" ("organization_id", "feature_key") `);
        await queryRunner.query(`ALTER TABLE "audit_logs" ADD CONSTRAINT "FK_2d031e6155834882f54dcd6b4f5" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE SET NULL ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "audit_logs" ADD CONSTRAINT "FK_cfa83f61e4d27a87fcae1e025ab" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "subscriptions" ADD CONSTRAINT "FK_a7a84c705f3e8e4fbd497cfb119" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "subscriptions" DROP CONSTRAINT "FK_a7a84c705f3e8e4fbd497cfb119"`);
        await queryRunner.query(`ALTER TABLE "audit_logs" DROP CONSTRAINT "FK_cfa83f61e4d27a87fcae1e025ab"`);
        await queryRunner.query(`ALTER TABLE "audit_logs" DROP CONSTRAINT "FK_2d031e6155834882f54dcd6b4f5"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_1c202fe5763cff8553fc794c3b"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_b2e47b9a379b4299051bd8f446"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_eeb28b686a8c3472a22d67d239"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_cfa83f61e4d27a87fcae1e025a"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_9885c0f9a2e4081ebae4313d87"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_eb2d8e058d2b6160818d17acf8"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_cfa83f61e4d27a87fcae1e025a"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_2d031e6155834882f54dcd6b4f"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_09f6f001b6bc1310462566039f"`);
        await queryRunner.query(`ALTER TABLE "audit_logs" DROP COLUMN "userId"`);
        await queryRunner.query(`ALTER TABLE "audit_logs" ADD "userId" character varying NOT NULL`);
        await queryRunner.query(`CREATE INDEX "IDX_cfa83f61e4d27a87fcae1e025a" ON "audit_logs" ("userId") `);
        await queryRunner.query(`ALTER TABLE "audit_logs" DROP COLUMN "organizationId"`);
        await queryRunner.query(`CREATE UNIQUE INDEX "IDX_fafcbcfeeedd09f4e4e36a8b93" ON "organization_usage" ("organization_id", "feature_key") `);
        await queryRunner.query(`CREATE INDEX "IDX_c14d29c69c2fcd936af129d5b8" ON "organization_usage" ("organization_id") `);
    }

}
