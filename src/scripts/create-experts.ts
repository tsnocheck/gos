import { NestFactory } from '@nestjs/core';
import { AppModule } from '../app.module';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../users/entities/user.entity';
import { UserRole, UserStatus } from '../users/enums/user.enum';
import * as bcrypt from 'bcrypt';

async function createExpertUsers() {
  const app = await NestFactory.createApplicationContext(AppModule);
  const userRepository = app.get<Repository<User>>('UserRepository');

  const experts = [
    {
      firstName: 'Иван',
      lastName: 'Экспертов',
      middleName: 'Петрович',
      email: 'expert1@koiro.ru',
      password: 'expert123456',
      roles: [UserRole.EXPERT],
      workplace: 'КОИРО',
      department: 'Отдел экспертизы',
      position: 'Эксперт',
      subjects: ['Математика', 'Информатика'],
    },
    {
      firstName: 'Мария',
      lastName: 'Экспертова',
      middleName: 'Сергеевна',
      email: 'expert2@koiro.ru',
      password: 'expert123456',
      roles: [UserRole.EXPERT],
      workplace: 'КОИРО',
      department: 'Отдел образования',
      position: 'Начальник отдела',
      subjects: ['Русский язык', 'Литература'],
    },
    {
      firstName: 'Владимир',
      lastName: 'Вейдт',
      middleName: 'Петрович',
      email: 'veidt@koiro.ru',
      password: 'expert123456',
      roles: [UserRole.EXPERT],
      workplace: 'КОИРО',
      department: 'Экспертный совет',
      position: 'Председатель экспертного совета',
      subjects: ['Педагогика', 'Методология'],
    },
  ];

  for (const expertData of experts) {
    try {
      // Проверяем, не существует ли уже такой пользователь
      const existingUser = await userRepository.findOne({
        where: { email: expertData.email }
      });

      if (existingUser) {
        console.log(`Пользователь с email ${expertData.email} уже существует, пропускаем...`);
        continue;
      }

      const hashedPassword = await bcrypt.hash(expertData.password, 10);
      
      const user = userRepository.create({
        firstName: expertData.firstName,
        lastName: expertData.lastName,
        middleName: expertData.middleName,
        email: expertData.email,
        password: hashedPassword,
        roles: expertData.roles,
        workplace: expertData.workplace,
        department: expertData.department,
        position: expertData.position,
        subjects: expertData.subjects,
        status: UserStatus.ACTIVE,
      });

      const expert = await userRepository.save(user);
      console.log(`Создан эксперт: ${expert.firstName} ${expert.lastName} (${expert.email})`);
    } catch (error) {
      console.error(`Ошибка при создании эксперта ${expertData.email}:`, error.message);
    }
  }

  await app.close();
  console.log('Создание экспертов завершено');
}

createExpertUsers().catch(console.error);
