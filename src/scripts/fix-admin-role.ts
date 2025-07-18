import { NestFactory } from '@nestjs/core';
import { AppModule } from '../app.module';
import { UsersService } from '../users/users.service';
import { UserRole } from '../users/enums/user.enum';

async function fixAdminRole() {
  const app = await NestFactory.createApplicationContext(AppModule);
  const usersService = app.get(UsersService);

  const adminEmail = 'admin@gos.ru';

  try {
    // Находим администратора
    const admin = await usersService.findByEmail(adminEmail);
    
    if (!admin) {
      console.log('❌ Администратор не найден!');
      await app.close();
      return;
    }

    console.log('Текущие роли администратора:', admin.roles);

    // Обновляем роли администратора
    if (!admin.roles.includes(UserRole.ADMIN)) {
      // Добавляем роль админа к существующим ролям
      admin.roles = [...admin.roles, UserRole.ADMIN];
      
      await usersService['userRepository'].save(admin);
      
      console.log('✅ Роль администратора обновлена!');
      console.log('Новые роли:', admin.roles);
    } else {
      console.log('✅ Роль администратора уже корректна');
    }

  } catch (error) {
    console.error('❌ Ошибка при обновлении роли администратора:', error.message);
  } finally {
    await app.close();
  }
}

// Запускаем только если файл вызван напрямую
if (require.main === module) {
  fixAdminRole().catch(console.error);
}

export { fixAdminRole };
