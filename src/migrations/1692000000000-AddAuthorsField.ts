import { MigrationInterface, QueryRunner } from "typeorm";

export class AddAuthorsField1692000000000 implements MigrationInterface {
    name = 'AddAuthorsField1692000000000'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "programs" ADD "authors" json`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "programs" DROP COLUMN "authors"`);
    }
}
