import { NestFactory } from '@nestjs/core';
import { AppModule } from './src/app.module';
import { UsersService } from './src/users/users.service';
import { ProgramsService } from './src/programs/services/programs.service';
import { ExpertAssignmentService } from './src/programs/services/expert-assignment.service';
import { CreateProgramDto } from './src/programs/dto/program.dto';
import { UserRole, UserStatus } from './src/users/enums/user.enum';
import { Repository } from 'typeorm';
import { User } from './src/users/entities/user.entity';
import { getRepositoryToken } from '@nestjs/typeorm';

async function testCompleteWorkflow() {
  console.log('🧪 Тестирование полного рабочего процесса автоматического назначения экспертов\n');

  const app = await NestFactory.createApplicationContext(AppModule);
  
  const usersService = app.get(UsersService);
  const programsService = app.get(ProgramsService);
  const expertAssignmentService = app.get(ExpertAssignmentService);
  const userRepository = app.get<Repository<User>>(getRepositoryToken(User));

  try {
    // 1. Создаем тестового автора
    console.log('👤 Создание тестового автора...');
    const authorData = {
      email: `complete-test-author-${Date.now()}@test.com`,
      password: 'TestPassword123!',
      firstName: 'Полный',
      lastName: 'Тест',
      department: 'Отдел тестирования',
      position: 'Тестировщик',
      roles: [UserRole.AUTHOR],
      status: UserStatus.ACTIVE
    };

    const author = await usersService.create(authorData);
    console.log('✅ Автор создан:', author.firstName, author.lastName, 'ID:', author.id);

    // 2. Проверяем количество экспертов
    console.log('\n🔍 Проверка экспертов в системе...');
    const allExperts = await userRepository
      .createQueryBuilder('user')
      .where("array_to_string(user.roles, ',') LIKE :pattern", { pattern: `%${UserRole.EXPERT}%` })
      .getMany();
    
    console.log(`📊 Найдено экспертов: ${allExperts.length}`);
    allExperts.forEach((expert, index) => {
      console.log(`   ${index + 1}. ${expert.firstName} ${expert.lastName} (${expert.email})`);
    });

    if (allExperts.length < 2) {
      console.log('❌ Недостаточно экспертов для тестирования!');
      await app.close();
      return;
    }

    // 3. Создаем программу
    console.log('\n📚 Создание программы...');
    const programData: CreateProgramDto = {
      title: `Полный тест автоматического назначения экспертов ${Date.now()}`,
      description: 'Программа для тестирования полного рабочего процесса',
      targetAudience: 'Разработчики',
      duration: 40,
      competencies: 'Проверить автоматическое назначение экспертов',
      content: 'Создать программу, Проверить назначение экспертов',
      learningOutcomes: '3 эксперта назначены автоматически'
    };

    const program = await programsService.create(programData, author);
    console.log('✅ Программа создана:', program.title);
    console.log('📊 ID программы:', program.id);

    // 4. Проверяем экспертизы
    console.log('\n🔍 Проверка назначенных экспертов...');
    
    // Небольшая задержка для завершения процесса
    await new Promise(resolve => setTimeout(resolve, 2000));

    const programWithExpertises = await programsService.findOne(program.id, author);
    
    if (programWithExpertises.expertises && programWithExpertises.expertises.length > 0) {
      console.log(`✅ УСПЕХ! Назначено экспертиз: ${programWithExpertises.expertises.length}`);
      programWithExpertises.expertises.forEach((expertise, index) => {
        console.log(`   ${index + 1}. ${expertise.expert.firstName} ${expertise.expert.lastName}`);
        console.log(`      - Позиция: ${expertise.position || 'не указана'}`);
        console.log(`      - Дата назначения: ${expertise.assignedAt}`);
        console.log(`      - Статус: ${expertise.status}`);
      });
    } else {
      console.log('❌ ОШИБКА! Эксперты НЕ были автоматически назначены');
    }

  } catch (error) {
    console.error('❌ Ошибка теста:', error.message);
    console.error(error.stack);
  }

  await app.close();
  console.log('\n🎉 Тестирование завершено!');
}

// Запускаем тест
testCompleteWorkflow();
