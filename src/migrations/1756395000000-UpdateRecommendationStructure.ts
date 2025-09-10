import { MigrationInterface, QueryRunner } from 'typeorm';

export class UpdateRecommendationStructure1756395000000 implements MigrationInterface {
  name = 'UpdateRecommendationStructure1756395000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Удаляем столбцы priority и dueDate
    await queryRunner.query(`ALTER TABLE "recommendations" DROP COLUMN IF EXISTS "priority"`);
    await queryRunner.query(`ALTER TABLE "recommendations" DROP COLUMN IF EXISTS "dueDate"`);
    
    // Изменяем тип столбца type с enum на varchar
    await queryRunner.query(`ALTER TABLE "recommendations" ALTER COLUMN "type" DROP DEFAULT`);
    await queryRunner.query(`ALTER TABLE "recommendations" ALTER COLUMN "type" TYPE varchar USING "type"::varchar`);
    await queryRunner.query(`ALTER TABLE "recommendations" ALTER COLUMN "type" SET DEFAULT NULL`);
    
    // Обновляем enum для status, добавляем новые статусы
    await queryRunner.query(`ALTER TABLE "recommendations" ALTER COLUMN "status" TYPE varchar`);
    
    // Обновляем существующие записи
    await queryRunner.query(`UPDATE "recommendations" SET "status" = 'inactive' WHERE "status" IN ('ignored')`);
    
    // Создаем новый enum с четырьмя значениями
    await queryRunner.query(`CREATE TYPE "recommendations_status_enum_new" AS ENUM('active', 'inactive', 'resolved', 'archived')`);
    await queryRunner.query(`ALTER TABLE "recommendations" ALTER COLUMN "status" TYPE "recommendations_status_enum_new" USING "status"::"recommendations_status_enum_new"`);
    await queryRunner.query(`DROP TYPE IF EXISTS "recommendations_status_enum"`);
    await queryRunner.query(`ALTER TYPE "recommendations_status_enum_new" RENAME TO "recommendations_status_enum"`);
    
    // Устанавливаем значение по умолчанию
    await queryRunner.query(`ALTER TABLE "recommendations" ALTER COLUMN "status" SET DEFAULT 'active'`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Возвращаем старую структуру (если нужно откатить изменения)
    await queryRunner.query(`ALTER TABLE "recommendations" ADD "priority" integer DEFAULT 1`);
    await queryRunner.query(`ALTER TABLE "recommendations" ADD "dueDate" TIMESTAMP`);
    
    // Восстанавливаем enum для type
    await queryRunner.query(`CREATE TYPE "recommendations_type_enum" AS ENUM('general', 'content', 'methodology', 'structure', 'assessment')`);
    await queryRunner.query(`ALTER TABLE "recommendations" ALTER COLUMN "type" TYPE "recommendations_type_enum" USING 'general'::"recommendations_type_enum"`);
    await queryRunner.query(`ALTER TABLE "recommendations" ALTER COLUMN "type" SET DEFAULT 'general'`);
    
    // Восстанавливаем старый enum для status
    await queryRunner.query(`CREATE TYPE "recommendations_status_enum_old" AS ENUM('active', 'resolved', 'ignored', 'archived')`);
    await queryRunner.query(`ALTER TABLE "recommendations" ALTER COLUMN "status" TYPE "recommendations_status_enum_old" USING 'active'::"recommendations_status_enum_old"`);
    await queryRunner.query(`DROP TYPE "recommendations_status_enum"`);
    await queryRunner.query(`ALTER TYPE "recommendations_status_enum_old" RENAME TO "recommendations_status_enum"`);
  }
}
