import { MigrationInterface, QueryRunner } from "typeorm";

export class AddAuthorsField1692000000000 implements MigrationInterface {
    name = 'AddAuthorsField1692000000000'

    public async up(queryRunner: QueryRunner): Promise<void> {
        // Добавляем поле authors в таблицу programs
        await queryRunner.query(`ALTER TABLE "programs" ADD "authors" json`);
        
        // Добавляем поле coAuthorIds в таблицу programs
        await queryRunner.query(`ALTER TABLE "programs" ADD "coAuthorIds" json`);
        
        // Создаем таблицу для Many-to-Many связи между программами и соавторами
        await queryRunner.query(`CREATE TABLE "program_coauthors" ("programId" uuid NOT NULL, "coauthorId" uuid NOT NULL, CONSTRAINT "PK_program_coauthors" PRIMARY KEY ("programId", "coauthorId"))`);
        await queryRunner.query(`CREATE INDEX "IDX_program_coauthors_programId" ON "program_coauthors" ("programId")`);
        await queryRunner.query(`CREATE INDEX "IDX_program_coauthors_coauthorId" ON "program_coauthors" ("coauthorId")`);
        
        // Добавляем внешние ключи
        await queryRunner.query(`ALTER TABLE "program_coauthors" ADD CONSTRAINT "FK_program_coauthors_programId" FOREIGN KEY ("programId") REFERENCES "programs"("id") ON DELETE CASCADE ON UPDATE CASCADE`);
        await queryRunner.query(`ALTER TABLE "program_coauthors" ADD CONSTRAINT "FK_program_coauthors_coauthorId" FOREIGN KEY ("coauthorId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        // Удаляем внешние ключи
        await queryRunner.query(`ALTER TABLE "program_coauthors" DROP CONSTRAINT "FK_program_coauthors_coauthorId"`);
        await queryRunner.query(`ALTER TABLE "program_coauthors" DROP CONSTRAINT "FK_program_coauthors_programId"`);
        
        // Удаляем индексы
        await queryRunner.query(`DROP INDEX "IDX_program_coauthors_coauthorId"`);
        await queryRunner.query(`DROP INDEX "IDX_program_coauthors_programId"`);
        
        // Удаляем таблицу связей
        await queryRunner.query(`DROP TABLE "program_coauthors"`);
        
        // Удаляем поля из таблицы programs
        await queryRunner.query(`ALTER TABLE "programs" DROP COLUMN "coAuthorIds"`);
        await queryRunner.query(`ALTER TABLE "programs" DROP COLUMN "authors"`);
    }
}
