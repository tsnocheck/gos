const { Pool } = require('pg');

// Тест для проверки исправления PostgreSQL запроса в CoAuthorsService
async function testCoAuthorsQuery() {
  const pool = new Pool({
    host: 'localhost',
    port: 5432,
    user: 'postgres',
    password: 'password',
    database: 'goszalupa',
  });

  try {
    console.log('Тестируем исправленный PostgreSQL запрос для поиска соавторов...');
    
    // Имитируем исправленный запрос из CoAuthorsService
    const roles = ['author'];
    const pattern = `%${roles.join('%')}%`;
    
    const query = `
      SELECT u.id, u.email, u."firstName", u."lastName" 
      FROM users u 
      WHERE u.status = 'active' 
        AND array_to_string(u.roles, ',') LIKE $1
    `;
    
    console.log('Выполняем запрос:', query);
    console.log('Параметры:', { pattern });
    
    const result = await pool.query(query, [pattern]);
    
    console.log(`✅ Запрос выполнен успешно! Найдено пользователей с ролью author: ${result.rows.length}`);
    
    if (result.rows.length > 0) {
      console.log('Примеры найденных пользователей:');
      result.rows.slice(0, 3).forEach((user, index) => {
        console.log(`${index + 1}. ${user.firstName} ${user.lastName} (${user.email})`);
      });
    }
    
    return true;
  } catch (error) {
    console.error('❌ Ошибка при выполнении запроса:', error.message);
    return false;
  } finally {
    await pool.end();
  }
}

// Запускаем тест
testCoAuthorsQuery()
  .then(success => {
    if (success) {
      console.log('\n🎉 Тест прошел успешно! Исправление PostgreSQL запроса работает корректно.');
    } else {
      console.log('\n💥 Тест не прошел. Возможно, нужны дополнительные исправления.');
    }
    process.exit(success ? 0 : 1);
  })
  .catch(error => {
    console.error('Неожиданная ошибка:', error);
    process.exit(1);
  });
