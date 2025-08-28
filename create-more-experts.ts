import { NestFactory } from '@nestjs/core';
import { AppModule } from './src/app.module';
import { UsersService } from './src/users/users.service';
import { UserRole, UserStatus } from './src/users/enums/user.enum';

async function createMoreExperts() {
  const app = await NestFactory.createApplicationContext(AppModule);
  const usersService = app.get(UsersService);

  console.log('👥 Создание дополнительных экспертов...');

  const expertsToCreate = [
    {
      email: 'expert4@test.ru',
      password: 'expert123',
      firstName: 'Петр',
      lastName: 'Четвертый',
    },
    {
      email: 'expert5@test.ru',
      password: 'expert123',
      firstName: 'Анна',
      lastName: 'Пятая',
    },
    {
      email: 'expert6@test.ru',
      password: 'expert123',
      firstName: 'Сергей',
      lastName: 'Шестой',
    },
  ];

  for (const expertData of expertsToCreate) {
    try {
      const expert = await usersService.create(expertData);
      
      // Обновляем профиль и добавляем роль эксперта
      await usersService.update(expert.id, {
        firstName: expertData.firstName,
        lastName: expertData.lastName,
      });

      // Добавляем роль эксперта
      await usersService['userRepository']
        .createQueryBuilder()
        .update()
        .set({ 
          roles: [UserRole.EXPERT],
          status: UserStatus.ACTIVE
        })
        .where('id = :id', { id: expert.id })
        .execute();

      console.log(`✅ Создан эксперт: ${expertData.firstName} ${expertData.lastName}`);
    } catch (error) {
      console.log(`❌ Ошибка создания эксперта ${expertData.email}:`, error.message);
    }
  }

  // Проверим общее количество экспертов
  const experts = await usersService['userRepository']
    .createQueryBuilder('user')
    .where("array_to_string(user.roles, ',') LIKE :pattern", { pattern: `%${UserRole.EXPERT}%` })
    .andWhere('user.status = :status', { status: UserStatus.ACTIVE })
    .getMany();

  console.log(`📊 Всего активных экспертов: ${experts.length}`);
  
  await app.close();
}

if (require.main === module) {
  createMoreExperts();
}
