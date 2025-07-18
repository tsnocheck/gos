import { NestFactory } from '@nestjs/core';
import { AppModule } from '../app.module';
import { UsersService } from '../users/users.service';
import { UserRole, UserStatus } from '../users/enums/user.enum';
import * as bcrypt from 'bcrypt';

async function createAdminUser() {
  const app = await NestFactory.createApplicationContext(AppModule);
  const usersService = app.get(UsersService);

  const adminEmail = 'admin@gos.ru';
  const adminPassword = 'admin123456'; // В продакшене должен быть сильный пароль

  try {
    // Проверяем, существует ли уже администратор
    const existingAdmin = await usersService.findByEmail(adminEmail);
    
    if (existingAdmin) {
      console.log('❌ Администратор уже существует!');
      console.log(`Email: ${existingAdmin.email}`);
      console.log(`Roles: ${existingAdmin.roles.join(', ')}`);
      console.log(`Status: ${existingAdmin.status}`);
      await app.close();
      return;
    }

    // Создаем администратора
    const hashedPassword = await bcrypt.hash(adminPassword, 10);
    
    const adminUser = await usersService['userRepository'].save({
      email: adminEmail,
      password: hashedPassword,
      roles: [UserRole.ADMIN],
      status: UserStatus.ACTIVE,
      firstName: 'Администратор',
      lastName: 'Системы',
    });

    console.log('✅ Администратор успешно создан!');
    console.log(`Email: ${adminEmail}`);
    console.log(`Password: ${adminPassword}`);
    console.log(`Roles: ${adminUser.roles.join(', ')}`);
    console.log(`Status: ${adminUser.status}`);
    console.log('\n⚠️  ВАЖНО: Смените пароль администратора после первого входа!');

  } catch (error) {
    console.error('❌ Ошибка при создании администратора:', error.message);
  } finally {
    await app.close();
  }
}

// Запускаем только если файл вызван напрямую
if (require.main === module) {
  createAdminUser().catch(console.error);
}

export { createAdminUser };
