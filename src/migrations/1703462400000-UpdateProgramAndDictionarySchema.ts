import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';

export class UpdateProgramAndDictionarySchema1703462400000 implements MigrationInterface {
  name = 'UpdateProgramAndDictionarySchema1703462400000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Изменяем тип поля type в таблице dictionaries
    await queryRunner.changeColumn(
      'dictionaries',
      'type',
      new TableColumn({
        name: 'type',
        type: 'varchar',
        isNullable: false,
      }),
    );

    // Добавляем новые поля в таблицу programs
    await queryRunner.addColumns('programs', [
      new TableColumn({
        name: 'author1Id',
        type: 'uuid',
        isNullable: true,
      }),
      new TableColumn({
        name: 'author2Id',
        type: 'uuid',
        isNullable: true,
      }),
      new TableColumn({
        name: 'institution',
        type: 'varchar',
        isNullable: true,
      }),
      new TableColumn({
        name: 'customInstitution',
        type: 'varchar',
        isNullable: true,
      }),
      new TableColumn({
        name: 'abbreviations',
        type: 'json',
        isNullable: true,
      }),
      new TableColumn({
        name: 'relevance',
        type: 'text',
        isNullable: true,
      }),
      new TableColumn({
        name: 'goal',
        type: 'text',
        isNullable: true,
      }),
      new TableColumn({
        name: 'standard',
        type: 'varchar',
        isNullable: true,
      }),
      new TableColumn({
        name: 'functions',
        type: 'json',
        isNullable: true,
      }),
      new TableColumn({
        name: 'actions',
        type: 'json',
        isNullable: true,
      }),
      new TableColumn({
        name: 'duties',
        type: 'json',
        isNullable: true,
      }),
      new TableColumn({
        name: 'know',
        type: 'text',
        isNullable: true,
      }),
      new TableColumn({
        name: 'can',
        type: 'text',
        isNullable: true,
      }),
      new TableColumn({
        name: 'category',
        type: 'varchar',
        isNullable: true,
      }),
      new TableColumn({
        name: 'educationForm',
        type: 'varchar',
        isNullable: true,
      }),
      new TableColumn({
        name: 'term',
        type: 'int',
        isNullable: true,
      }),
      new TableColumn({
        name: 'modules',
        type: 'json',
        isNullable: true,
      }),
      new TableColumn({
        name: 'attestations',
        type: 'json',
        isNullable: true,
      }),
      new TableColumn({
        name: 'topics',
        type: 'json',
        isNullable: true,
      }),
      new TableColumn({
        name: 'network',
        type: 'json',
        isNullable: true,
      }),
      new TableColumn({
        name: 'networkEnabled',
        type: 'boolean',
        default: false,
      }),
      new TableColumn({
        name: 'criteria',
        type: 'text',
        isNullable: true,
      }),
      new TableColumn({
        name: 'examples',
        type: 'text',
        isNullable: true,
      }),
      new TableColumn({
        name: 'attempts',
        type: 'int',
        isNullable: true,
      }),
      new TableColumn({
        name: 'orgPedConditions',
        type: 'json',
        isNullable: true,
      }),
    ]);

    // Создаем foreign key для author1Id
    await queryRunner.query(`
      ALTER TABLE "programs" 
      ADD CONSTRAINT "FK_programs_author1" 
      FOREIGN KEY ("author1Id") 
      REFERENCES "users"("id") 
      ON DELETE SET NULL
    `);

    // Создаем foreign key для author2Id
    await queryRunner.query(`
      ALTER TABLE "programs" 
      ADD CONSTRAINT "FK_programs_author2" 
      FOREIGN KEY ("author2Id") 
      REFERENCES "users"("id") 
      ON DELETE SET NULL
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Удаляем foreign keys
    await queryRunner.query('ALTER TABLE "programs" DROP CONSTRAINT "FK_programs_author1"');
    await queryRunner.query('ALTER TABLE "programs" DROP CONSTRAINT "FK_programs_author2"');

    // Удаляем добавленные колонки
    await queryRunner.dropColumns('programs', [
      'author1Id',
      'author2Id',
      'institution',
      'customInstitution',
      'abbreviations',
      'relevance',
      'goal',
      'standard',
      'functions',
      'actions',
      'duties',
      'know',
      'can',
      'category',
      'educationForm',
      'term',
      'modules',
      'attestations',
      'topics',
      'network',
      'networkEnabled',
      'criteria',
      'examples',
      'attempts',
      'orgPedConditions',
    ]);

    // Возвращаем поле type в исходное состояние (enum)
    await queryRunner.changeColumn(
      'dictionaries',
      'type',
      new TableColumn({
        name: 'type',
        type: 'enum',
        enum: [
          'workplace',
          'department',
          'position',
          'academic_degree',
          'subject',
          'institutions',
          'subdivisions',
          'labor_functions',
          'labor_actions',
          'job_responsibilities',
          'student_categories',
          'education_forms',
          'subjects',
          'expert_algorithms',
          'koiro_subdivisions',
          'koiro_managers',
        ],
        isNullable: false,
      }),
    );
  }
}
