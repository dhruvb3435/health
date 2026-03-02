import { MigrationInterface, QueryRunner } from "typeorm";

export class AddEmailVerificationTokens1772410000000 implements MigrationInterface {
    name = 'AddEmailVerificationTokens1772410000000';

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            CREATE TABLE "email_verification_tokens" (
                "id"          UUID                NOT NULL DEFAULT uuid_generate_v4(),
                "userId"      UUID                NOT NULL,
                "tokenHash"   CHARACTER VARYING   NOT NULL,
                "expiresAt"   TIMESTAMP           NOT NULL,
                "createdAt"   TIMESTAMP           NOT NULL DEFAULT now(),
                CONSTRAINT "PK_email_verification_tokens" PRIMARY KEY ("id"),
                CONSTRAINT "UQ_evt_tokenHash" UNIQUE ("tokenHash"),
                CONSTRAINT "FK_evt_user"
                    FOREIGN KEY ("userId")
                    REFERENCES "users"("id")
                    ON DELETE CASCADE
            )
        `);

        await queryRunner.query(
            `CREATE INDEX "IDX_evt_userId"    ON "email_verification_tokens" ("userId")`
        );
        await queryRunner.query(
            `CREATE INDEX "IDX_evt_expiresAt" ON "email_verification_tokens" ("expiresAt")`
        );
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP INDEX "public"."IDX_evt_expiresAt"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_evt_userId"`);
        await queryRunner.query(`DROP TABLE "email_verification_tokens"`);
    }
}
