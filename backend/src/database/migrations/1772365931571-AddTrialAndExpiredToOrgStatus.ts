import { MigrationInterface, QueryRunner } from "typeorm";

export class AddTrialAndExpiredToOrgStatus1772365931571 implements MigrationInterface {
    name = 'AddTrialAndExpiredToOrgStatus1772365931571'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "email_verification_tokens" DROP CONSTRAINT "FK_evt_user"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_evt_userId"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_evt_expiresAt"`);
        await queryRunner.query(`CREATE TYPE "public"."plans_tier_enum" AS ENUM('basic', 'pro', 'enterprise')`);
        await queryRunner.query(`CREATE TYPE "public"."plans_billingcycle_enum" AS ENUM('MONTHLY', 'YEARLY', 'ONCE')`);
        await queryRunner.query(`CREATE TABLE "plans" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "tier" "public"."plans_tier_enum" NOT NULL, "name" character varying NOT NULL, "slug" character varying NOT NULL, "description" text, "price" numeric(10,2) NOT NULL DEFAULT '0', "currency" character varying NOT NULL DEFAULT 'INR', "billingCycle" "public"."plans_billingcycle_enum" NOT NULL DEFAULT 'MONTHLY', "productId" character varying, "priceId" character varying, "isActive" boolean NOT NULL DEFAULT true, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "UQ_8f72a20c98ab97e783c5e87ea2a" UNIQUE ("tier"), CONSTRAINT "UQ_e7b71bb444e74ee067df057397e" UNIQUE ("slug"), CONSTRAINT "PK_3720521a81c7c24fe9b7202ba61" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "IDX_8f72a20c98ab97e783c5e87ea2" ON "plans" ("tier") `);
        await queryRunner.query(`CREATE INDEX "IDX_e7b71bb444e74ee067df057397" ON "plans" ("slug") `);
        await queryRunner.query(`CREATE TYPE "public"."subscriptions_status_enum" AS ENUM('TRIAL', 'ACTIVE', 'PAST_DUE', 'CANCELLED', 'EXPIRED')`);
        await queryRunner.query(`CREATE TABLE "subscriptions" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "organizationId" uuid NOT NULL, "planId" uuid NOT NULL, "status" "public"."subscriptions_status_enum" NOT NULL DEFAULT 'TRIAL', "trialStartDate" TIMESTAMP, "trialEndDate" TIMESTAMP, "currentPeriodStart" TIMESTAMP, "currentPeriodEnd" TIMESTAMP, "cancelAtPeriodEnd" boolean NOT NULL DEFAULT false, "gatewaySubscriptionId" character varying, "gatewayCustomerId" character varying, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "UQ_a7a84c705f3e8e4fbd497cfb119" UNIQUE ("organizationId"), CONSTRAINT "PK_a87248d73155605cf782be9ee5e" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "IDX_a7a84c705f3e8e4fbd497cfb11" ON "subscriptions" ("organizationId") `);
        await queryRunner.query(`CREATE INDEX "IDX_6ccf973355b70645eff37774de" ON "subscriptions" ("status") `);
        await queryRunner.query(`CREATE TYPE "public"."feature_limits_resetinterval_enum" AS ENUM('MONTHLY', 'LIFETIME')`);
        await queryRunner.query(`CREATE TABLE "feature_limits" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "planId" uuid NOT NULL, "featureKey" character varying NOT NULL, "limitValue" integer, "isEnabled" boolean NOT NULL DEFAULT true, "resetInterval" "public"."feature_limits_resetinterval_enum" NOT NULL DEFAULT 'LIFETIME', "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_5317cbbadd63ed051d0aba69d1a" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE UNIQUE INDEX "IDX_592f0be4e87e9d7c26e821fcab" ON "feature_limits" ("planId", "featureKey") `);
        await queryRunner.query(`CREATE TABLE "usage_tracking" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "organizationId" uuid NOT NULL, "featureKey" character varying NOT NULL, "currentUsage" integer NOT NULL DEFAULT '0', "lastResetAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_2879a43395bb513204f88769aa6" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "IDX_7f0c2b4ef86ef6ac96aa5e3b06" ON "usage_tracking" ("organizationId") `);
        await queryRunner.query(`CREATE UNIQUE INDEX "IDX_1254d063997fbbd2036686787c" ON "usage_tracking" ("organizationId", "featureKey") `);
        await queryRunner.query(`CREATE TYPE "public"."payments_status_enum" AS ENUM('PENDING', 'SUCCEEDED', 'FAILED', 'REFUNDED')`);
        await queryRunner.query(`CREATE TABLE "payments" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "organizationId" uuid NOT NULL, "subscriptionId" uuid, "amount" numeric(10,2) NOT NULL, "currency" character varying NOT NULL DEFAULT 'INR', "status" "public"."payments_status_enum" NOT NULL DEFAULT 'PENDING', "paymentMethod" character varying, "gatewayTransactionId" character varying, "invoiceUrl" character varying, "paidAt" TIMESTAMP, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "UQ_3d0d9c611906c27b9914835d33c" UNIQUE ("gatewayTransactionId"), CONSTRAINT "PK_197ab7af18c93fbb0c9b28b4a59" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "IDX_eca6657201343626d980b33925" ON "payments" ("organizationId") `);
        await queryRunner.query(`CREATE INDEX "IDX_32b41cdb985a296213e9a928b5" ON "payments" ("status") `);
        await queryRunner.query(`CREATE INDEX "IDX_3d0d9c611906c27b9914835d33" ON "payments" ("gatewayTransactionId") `);
        await queryRunner.query(`ALTER TYPE "public"."organizations_status_enum" RENAME TO "organizations_status_enum_old"`);
        await queryRunner.query(`CREATE TYPE "public"."organizations_status_enum" AS ENUM('active', 'suspended', 'pending', 'trial', 'expired')`);
        await queryRunner.query(`ALTER TABLE "organizations" ALTER COLUMN "status" DROP DEFAULT`);
        await queryRunner.query(`ALTER TABLE "organizations" ALTER COLUMN "status" TYPE "public"."organizations_status_enum" USING "status"::"text"::"public"."organizations_status_enum"`);
        await queryRunner.query(`ALTER TABLE "organizations" ALTER COLUMN "status" SET DEFAULT 'pending'`);
        await queryRunner.query(`DROP TYPE "public"."organizations_status_enum_old"`);
        await queryRunner.query(`CREATE INDEX "IDX_10f285d038feb767bf7c2da14b" ON "email_verification_tokens" ("userId") `);
        await queryRunner.query(`CREATE INDEX "IDX_464e435574cc84eb70e4baef19" ON "email_verification_tokens" ("expiresAt") `);
        await queryRunner.query(`ALTER TABLE "subscriptions" ADD CONSTRAINT "FK_7536cba909dd7584a4640cad7d5" FOREIGN KEY ("planId") REFERENCES "plans"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "feature_limits" ADD CONSTRAINT "FK_2030dce8e15c75f57320c9b4b3f" FOREIGN KEY ("planId") REFERENCES "plans"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "payments" ADD CONSTRAINT "FK_2017d0cbfdbfec6b1b388e6aa08" FOREIGN KEY ("subscriptionId") REFERENCES "subscriptions"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "email_verification_tokens" ADD CONSTRAINT "FK_10f285d038feb767bf7c2da14b3" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "email_verification_tokens" DROP CONSTRAINT "FK_10f285d038feb767bf7c2da14b3"`);
        await queryRunner.query(`ALTER TABLE "payments" DROP CONSTRAINT "FK_2017d0cbfdbfec6b1b388e6aa08"`);
        await queryRunner.query(`ALTER TABLE "feature_limits" DROP CONSTRAINT "FK_2030dce8e15c75f57320c9b4b3f"`);
        await queryRunner.query(`ALTER TABLE "subscriptions" DROP CONSTRAINT "FK_7536cba909dd7584a4640cad7d5"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_464e435574cc84eb70e4baef19"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_10f285d038feb767bf7c2da14b"`);
        await queryRunner.query(`CREATE TYPE "public"."organizations_status_enum_old" AS ENUM('active', 'suspended', 'pending')`);
        await queryRunner.query(`ALTER TABLE "organizations" ALTER COLUMN "status" DROP DEFAULT`);
        await queryRunner.query(`ALTER TABLE "organizations" ALTER COLUMN "status" TYPE "public"."organizations_status_enum_old" USING "status"::"text"::"public"."organizations_status_enum_old"`);
        await queryRunner.query(`ALTER TABLE "organizations" ALTER COLUMN "status" SET DEFAULT 'pending'`);
        await queryRunner.query(`DROP TYPE "public"."organizations_status_enum"`);
        await queryRunner.query(`ALTER TYPE "public"."organizations_status_enum_old" RENAME TO "organizations_status_enum"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_3d0d9c611906c27b9914835d33"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_32b41cdb985a296213e9a928b5"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_eca6657201343626d980b33925"`);
        await queryRunner.query(`DROP TABLE "payments"`);
        await queryRunner.query(`DROP TYPE "public"."payments_status_enum"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_1254d063997fbbd2036686787c"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_7f0c2b4ef86ef6ac96aa5e3b06"`);
        await queryRunner.query(`DROP TABLE "usage_tracking"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_592f0be4e87e9d7c26e821fcab"`);
        await queryRunner.query(`DROP TABLE "feature_limits"`);
        await queryRunner.query(`DROP TYPE "public"."feature_limits_resetinterval_enum"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_6ccf973355b70645eff37774de"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_a7a84c705f3e8e4fbd497cfb11"`);
        await queryRunner.query(`DROP TABLE "subscriptions"`);
        await queryRunner.query(`DROP TYPE "public"."subscriptions_status_enum"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_e7b71bb444e74ee067df057397"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_8f72a20c98ab97e783c5e87ea2"`);
        await queryRunner.query(`DROP TABLE "plans"`);
        await queryRunner.query(`DROP TYPE "public"."plans_billingcycle_enum"`);
        await queryRunner.query(`DROP TYPE "public"."plans_tier_enum"`);
        await queryRunner.query(`CREATE INDEX "IDX_evt_expiresAt" ON "email_verification_tokens" ("expiresAt") `);
        await queryRunner.query(`CREATE INDEX "IDX_evt_userId" ON "email_verification_tokens" ("userId") `);
        await queryRunner.query(`ALTER TABLE "email_verification_tokens" ADD CONSTRAINT "FK_evt_user" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
    }

}
