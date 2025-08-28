import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddRevisionHistoryToPrograms1756290001000 implements MigrationInterface {
  name = 'AddRevisionHistoryToPrograms1756290001000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "programs" 
      ADD COLUMN "revisionHistory" text
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "programs" 
      DROP COLUMN "revisionHistory"
    `);
  }
}
