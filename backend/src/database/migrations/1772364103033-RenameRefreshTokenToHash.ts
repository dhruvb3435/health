import { MigrationInterface, QueryRunner } from "typeorm";

export class RenameRefreshTokenToHash1772364103033 implements MigrationInterface {

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.renameColumn('users', 'refreshToken', 'refreshTokenHash');
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.renameColumn('users', 'refreshTokenHash', 'refreshToken');
    }

}
