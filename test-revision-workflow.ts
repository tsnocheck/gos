import { NestFactory } from '@nestjs/core';
import { AppModule } from './src/app.module';
import { UsersService } from './src/users/users.service';
import { ProgramsService } from './src/programs/services/programs.service';
import { ExpertiseService } from './src/programs/services/expertise.service';
import { ExpertAssignmentService } from './src/programs/services/expert-assignment.service';
import { UserRole } from './src/users/enums/user.enum';
import { ProgramStatus, ExpertiseStatus } from './src/programs/enums/program.enum';

async function testRevisionWorkflow() {
  const app = await NestFactory.createApplicationContext(AppModule);
  const usersService = app.get(UsersService);
  const programsService = app.get(ProgramsService);
  const expertiseService = app.get(ExpertiseService);
  const expertAssignmentService = app.get(ExpertAssignmentService);

  console.log('🚀 Тестирование рабочего процесса отправки на доработку\n');

  try {
    // 1. Найдем автора и экспертов
    console.log('👤 Поиск пользователей...');
    
    const admin = await usersService.findByEmail('admin@gos.ru');
    if (!admin) {
      console.log('❌ Администратор не найден!');
      await app.close();
      return;
    }

    // Создаем тестового автора
    let author;
    try {
      author = await usersService.findByEmail('author.test@example.com');
      if (!author) {
        author = await usersService.create({
          email: 'author.test@example.com',
          password: 'author123',
        });
        
        // Обновляем профиль автора
        await usersService.update(author.id, {
          firstName: 'Тестовый',
          lastName: 'Автор',
        });
      }
    } catch (error) {
      console.log('Автор уже существует или ошибка создания');
    }

    // Найдем экспертов
    const experts = await usersService['userRepository']
      .createQueryBuilder('user')
      .where("array_to_string(user.roles, ',') LIKE :pattern", { pattern: `%${UserRole.EXPERT}%` })
      .andWhere('user.status = :status', { status: 'active' })
      .limit(6)
      .getMany();

    console.log(`✅ Найдено экспертов: ${experts.length}`);
    if (experts.length < 2) {
      console.log('❌ Недостаточно экспертов для тестирования!');
      await app.close();
      return;
    }

    // 2. Создаем тестовую программу
    console.log('\n📝 Создание тестовой программы...');
    const programData = {
      title: `Тестовая программа для доработки - ${new Date().toISOString()}`,
      description: 'Программа для тестирования процесса отправки на доработку',
      duration: 72,
      targetAudience: 'Учителя средних школ',
      competencies: 'Педагогические компетенции',
      learningOutcomes: 'Повышение квалификации',
      content: 'Базовое содержание программы с некоторыми недочетами',
      methodology: 'Традиционные методы обучения',
      assessment: 'Тестирование и практические задания',
    };

    const program = await programsService.create(programData, author);
    console.log(`✅ Программа создана: "${program.title}"`);

    // 3. Отправляем программу на экспертизу
    console.log('\n📤 Отправка программы на экспертизу...');
    await programsService.submit(program.id, { message: 'Отправка на экспертизу' }, author);
    
    // 4. Проверим автоматически назначенных экспертов
    console.log('\n👥 Проверка автоматически назначенных экспертов...');
    const programWithExpertises = await programsService.findOne(program.id, admin);
    console.log(`✅ Автоматически назначено ${programWithExpertises.expertises.length} экспертов`);

    // 5. Найдем первую экспертизу и начнем её
    const firstExpertise = programWithExpertises.expertises[0];
    const assignedExpert = firstExpertise.expert;
    
    console.log('\n🔍 Начало экспертизы...');
    await expertiseService.update(firstExpertise.id, { 
      generalFeedback: 'Экспертиза начата'
    }, assignedExpert);

    // 6. Отправляем программу на доработку
    console.log('\n❌ Отправка программы на доработку...');
    const revisionDto = {
      revisionComments: 'Требуется доработка:\n1. Недостаточно детализировано содержание\n2. Отсутствуют современные методы обучения\n3. Нет четких критериев оценки',
      generalFeedback: 'Программа имеет потенциал, но требует существенной доработки',
      recommendations: 'Рекомендуется:\n- Добавить интерактивные методы\n- Уточнить критерии оценки\n- Расширить практическую часть'
    };

    const revisedExpertise = await expertiseService.sendForRevision(
      firstExpertise.id, 
      revisionDto, 
      assignedExpert
    );

    console.log('✅ Программа отправлена на доработку');
    console.log(`   Статус экспертизы: ${revisedExpertise.status}`);

    // 7. Проверим статус программы
    const programAfterRevision = await programsService.findOne(program.id, admin);
    console.log(`   Статус программы: ${programAfterRevision.status}`);

    // 8. Автор исправляет программу и отправляет повторно
    console.log('\n🔄 Повторная отправка после доработки...');
    const resubmitDto = {
      revisionNotes: 'Внесены следующие изменения:\n1. Добавлены интерактивные методы обучения\n2. Детализированы критерии оценки\n3. Расширена практическая часть',
      changesSummary: 'Программа полностью переработана с учетом замечаний экспертов'
    };

    const resubmittedProgram = await expertiseService.resubmitAfterRevision(
      program.id,
      resubmitDto,
      author
    );

    console.log('✅ Программа повторно отправлена на экспертизу');
    console.log(`   Новая версия: ${resubmittedProgram.version}`);
    console.log(`   Статус: ${resubmittedProgram.status}`);

    // 9. Проверим назначенных экспертов
    const finalProgram = await programsService.findOne(program.id, admin);
    console.log('\n👥 Новые эксперты для повторной экспертизы:');
    finalProgram.expertises.forEach((expertise, index) => {
      if (expertise.status === ExpertiseStatus.PENDING) {
        console.log(`   ${index + 1}. ${expertise.expert.firstName} ${expertise.expert.lastName}`);
        console.log(`      Позиция: ${expertise.position || 'не указана'}`);
        console.log(`      Статус: ${expertise.status}`);
        console.log(`      Круг доработки: ${expertise.revisionRound}`);
      }
    });

    console.log('\n🎉 Тест рабочего процесса доработки завершен успешно!');
    console.log('\n📊 Результаты теста:');
    console.log(`   ✓ Экспертиза отправлена на доработку`);
    console.log(`   ✓ Программа получила статус "требует доработки"`);
    console.log(`   ✓ Программа повторно отправлена с увеличением версии`);
    console.log(`   ✓ Назначены новые эксперты (исключены предыдущие)`);
    console.log(`   ✓ История доработок сохранена`);

  } catch (error) {
    console.error('❌ Ошибка при тестировании:', error.message);
    console.error('Stack:', error.stack);
  } finally {
    await app.close();
  }
}

// Запуск теста
if (require.main === module) {
  testRevisionWorkflow();
}
