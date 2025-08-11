import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';

export class AddExpertisePositionAndAssignedAt1754893600000 implements MigrationInterface {
  name = 'AddExpertisePositionAndAssignedAt1754893600000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Создаем enum тип для позиции эксперта, если его еще нет
    await queryRunner.query(`
      DO $$ BEGIN
        CREATE TYPE "expert_position_enum" AS ENUM('first', 'second', 'third');
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;
    `);

    // Добавляем колонку position
    await queryRunner.addColumn(
      'expertises',
      new TableColumn({
        name: 'position',
        type: 'enum',
        enum: ['first', 'second', 'third'],
        enumName: 'expert_position_enum',
        isNullable: true,
      }),
    );

    // Добавляем колонку assignedAt
    await queryRunner.addColumn(
      'expertises',
      new TableColumn({
        name: 'assignedAt',
        type: 'timestamp',
        isNullable: true,
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Удаляем колонки
    await queryRunner.dropColumn('expertises', 'assignedAt');
    await queryRunner.dropColumn('expertises', 'position');
    
    // Удаляем enum тип
    await queryRunner.query(`DROP TYPE IF EXISTS "expert_position_enum"`);
  }
}
