import { MigrationInterface, QueryRunner } from 'typeorm';

export class UpdateExpertiseStructure1756400000000 implements MigrationInterface {
  name = 'UpdateExpertiseStructure1756400000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Удаляем старые поля с числовыми оценками
    await queryRunner.query(`ALTER TABLE "expertises" DROP COLUMN IF EXISTS "relevanceScore"`);
    await queryRunner.query(`ALTER TABLE "expertises" DROP COLUMN IF EXISTS "contentQualityScore"`);
    await queryRunner.query(`ALTER TABLE "expertises" DROP COLUMN IF EXISTS "methodologyScore"`);
    await queryRunner.query(`ALTER TABLE "expertises" DROP COLUMN IF EXISTS "practicalValueScore"`);
    await queryRunner.query(`ALTER TABLE "expertises" DROP COLUMN IF EXISTS "innovationScore"`);
    await queryRunner.query(`ALTER TABLE "expertises" DROP COLUMN IF EXISTS "totalScore"`);
    await queryRunner.query(`ALTER TABLE "expertises" DROP COLUMN IF EXISTS "expertComments"`);

    // Добавляем новые поля для критериев в JSON формате
    await queryRunner.query(`ALTER TABLE "expertises" ADD "criterion1_1" jsonb`);
    await queryRunner.query(`ALTER TABLE "expertises" ADD "criterion1_2" jsonb`);
    await queryRunner.query(`ALTER TABLE "expertises" ADD "criterion1_3" jsonb`);
    await queryRunner.query(`ALTER TABLE "expertises" ADD "criterion1_4" jsonb`);
    await queryRunner.query(`ALTER TABLE "expertises" ADD "criterion1_5" jsonb`);
    await queryRunner.query(`ALTER TABLE "expertises" ADD "criterion2_1" jsonb`);
    await queryRunner.query(`ALTER TABLE "expertises" ADD "criterion2_2" jsonb`);
    await queryRunner.query(`ALTER TABLE "expertises" ADD "additionalRecommendation" text`);

    // Обновляем комментарий для isRecommendedForApproval
    await queryRunner.query(`COMMENT ON COLUMN "expertises"."isRecommendedForApproval" IS 'Рекомендуется к одобрению (автоматически вычисляется на основе критериев)'`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Удаляем новые поля
    await queryRunner.query(`ALTER TABLE "expertises" DROP COLUMN IF EXISTS "criterion1_1"`);
    await queryRunner.query(`ALTER TABLE "expertises" DROP COLUMN IF EXISTS "criterion1_2"`);
    await queryRunner.query(`ALTER TABLE "expertises" DROP COLUMN IF EXISTS "criterion1_3"`);
    await queryRunner.query(`ALTER TABLE "expertises" DROP COLUMN IF EXISTS "criterion1_4"`);
    await queryRunner.query(`ALTER TABLE "expertises" DROP COLUMN IF EXISTS "criterion1_5"`);
    await queryRunner.query(`ALTER TABLE "expertises" DROP COLUMN IF EXISTS "criterion2_1"`);
    await queryRunner.query(`ALTER TABLE "expertises" DROP COLUMN IF EXISTS "criterion2_2"`);
    await queryRunner.query(`ALTER TABLE "expertises" DROP COLUMN IF EXISTS "additionalRecommendation"`);

    // Восстанавливаем старые поля
    await queryRunner.query(`ALTER TABLE "expertises" ADD "relevanceScore" integer DEFAULT 0`);
    await queryRunner.query(`ALTER TABLE "expertises" ADD "contentQualityScore" integer DEFAULT 0`);
    await queryRunner.query(`ALTER TABLE "expertises" ADD "methodologyScore" integer DEFAULT 0`);
    await queryRunner.query(`ALTER TABLE "expertises" ADD "practicalValueScore" integer DEFAULT 0`);
    await queryRunner.query(`ALTER TABLE "expertises" ADD "innovationScore" integer DEFAULT 0`);
    await queryRunner.query(`ALTER TABLE "expertises" ADD "totalScore" decimal(3,1)`);
    await queryRunner.query(`ALTER TABLE "expertises" ADD "expertComments" text`);
  }
}
