# Примеры и тестовые сценарии

## Сценарии использования

### Сценарий 1: Управление жизненным циклом пользователя

#### Шаг 1: Создание пользователя через кандидата
```bash
# 1. Регистрация кандидата
curl -X POST http://localhost:3001/auth/register-candidate \
  -H "Content-Type: application/json" \
  -d '{
    "email": "new.user@example.com",
    "firstName": "Новый",
    "lastName": "Пользователь",
    "phone": "+7-999-123-45-67",
    "position": "Разработчик",
    "workplace": "ООО Компания",
    "department": "IT",
    "subjects": ["Программирование"],
    "academicDegree": "Бакалавр",
    "proposedRoles": ["author"]
  }'

# Ответ: {"candidateId": "uuid"}
```

#### Шаг 2: Одобрение администратором
```bash
# 2. Получение токена админа
ADMIN_TOKEN=$(curl -s -X POST http://localhost:3001/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "admin@goszalupa.ru", "password": "admin123456"}' \
  | jq -r '.accessToken')

# 3. Одобрение кандидата
curl -X POST http://localhost:3001/candidates/$CANDIDATE_ID/approve \
  -H "Authorization: Bearer $ADMIN_TOKEN"

# Ответ: {"user": {...}, "temporaryPassword": "temp123"}
```

#### Шаг 3: Управление пользователем
```bash
# 4. Редактирование пользователя
curl -X PATCH http://localhost:3001/users/admin/$USER_ID \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "position": "Старший разработчик",
    "roles": ["expert"]
  }'

# 5. Активация пользователя
curl -X PATCH http://localhost:3001/users/admin/$USER_ID/status \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"status": "active"}'
```

---

### Сценарий 2: Массовые операции с пользователями

#### Получение списка неактивных пользователей
```bash
# Получить всех пользователей и отфильтровать неактивных
curl -X GET http://localhost:3001/users/admin/all \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  | jq '.[] | select(.status == "inactive")'
```

#### Реактивация пользователей
```bash
# Массовая реактивация (пример скрипта)
INACTIVE_USERS=$(curl -s -X GET http://localhost:3001/users/admin/all \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  | jq -r '.[] | select(.status == "inactive") | .id')

for user_id in $INACTIVE_USERS; do
  curl -X PATCH http://localhost:3001/users/admin/$user_id/status \
    -H "Authorization: Bearer $ADMIN_TOKEN" \
    -H "Content-Type: application/json" \
    -d '{"status": "active"}'
  echo "Reactivated user: $user_id"
done
```

---

### Сценарий 3: Самообслуживание пользователей

#### Пользователь входит и редактирует профиль
```bash
# 1. Вход пользователя
USER_TOKEN=$(curl -s -X POST http://localhost:3001/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "user@example.com", "password": "user_password"}' \
  | jq -r '.accessToken')

# 2. Просмотр профиля
curl -X GET http://localhost:3001/users/profile \
  -H "Authorization: Bearer $USER_TOKEN"

# 3. Редактирование профиля
curl -X PATCH http://localhost:3001/users/profile \
  -H "Authorization: Bearer $USER_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "phone": "+7-999-888-77-66",
    "position": "Ведущий специалист",
    "department": "Новый отдел"
  }'

# 4. Смена пароля
curl -X PATCH http://localhost:3001/users/profile/password \
  -H "Authorization: Bearer $USER_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "currentPassword": "old_password",
    "newPassword": "new_secure_password"
  }'
```

---

## Автоматизированные тесты

### Полный тест административных функций

```bash
#!/bin/bash
# test-admin-complete.sh

set -e  # Прервать при ошибке

echo "=== Полный тест административных функций ==="

# Получение токена админа
echo "1. Получение токена администратора..."
ADMIN_RESPONSE=$(curl -s -X POST http://localhost:3001/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "admin@goszalupa.ru", "password": "admin123456"}')

ADMIN_TOKEN=$(echo $ADMIN_RESPONSE | jq -r '.accessToken')

if [ "$ADMIN_TOKEN" = "null" ]; then
  echo "❌ Не удалось получить токен админа"
  exit 1
fi
echo "✅ Токен получен"

# Создание тестового кандидата
echo "2. Создание тестового кандидата..."
CANDIDATE_RESPONSE=$(curl -s -X POST http://localhost:3001/auth/register-candidate \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test.admin.func@example.com",
    "firstName": "Тест",
    "lastName": "Админ",
    "middleName": "Функций",
    "phone": "+7-111-222-33-44",
    "position": "Тестировщик",
    "workplace": "Тестовая компания",
    "department": "QA",
    "subjects": ["Тестирование"],
    "academicDegree": "Магистр",
    "proposedRoles": ["author"]
  }')

CANDIDATE_ID=$(echo $CANDIDATE_RESPONSE | jq -r '.candidateId')
echo "✅ Кандидат создан: $CANDIDATE_ID"

# Одобрение кандидата
echo "3. Одобрение кандидата..."
APPROVE_RESPONSE=$(curl -s -X POST http://localhost:3001/candidates/$CANDIDATE_ID/approve \
  -H "Authorization: Bearer $ADMIN_TOKEN")

USER_ID=$(echo $APPROVE_RESPONSE | jq -r '.user.id')
TEMP_PASSWORD=$(echo $APPROVE_RESPONSE | jq -r '.temporaryPassword')
echo "✅ Пользователь создан: $USER_ID"
echo "✅ Временный пароль: $TEMP_PASSWORD"

# Тестирование редактирования
echo "4. Редактирование пользователя..."
curl -s -X PATCH http://localhost:3001/users/admin/$USER_ID \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "position": "Старший тестировщик",
    "workplace": "Улучшенная компания",
    "roles": ["expert"]
  }' > /dev/null
echo "✅ Пользователь отредактирован"

# Изменение статуса
echo "5. Активация пользователя..."
curl -s -X PATCH http://localhost:3001/users/admin/$USER_ID/status \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"status": "active"}' > /dev/null
echo "✅ Пользователь активирован"

# Вход пользователя
echo "6. Тестирование входа пользователя..."
USER_RESPONSE=$(curl -s -X POST http://localhost:3001/auth/login \
  -H "Content-Type: application/json" \
  -d "{\"email\": \"test.admin.func@example.com\", \"password\": \"$TEMP_PASSWORD\"}")

USER_TOKEN=$(echo $USER_RESPONSE | jq -r '.accessToken')
echo "✅ Пользователь вошёл в систему"

# Редактирование профиля пользователем
echo "7. Редактирование профиля пользователем..."
curl -s -X PATCH http://localhost:3001/users/profile \
  -H "Authorization: Bearer $USER_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "phone": "+7-555-666-77-88",
    "department": "Отдел качества"
  }' > /dev/null
echo "✅ Профиль отредактирован пользователем"

# Смена пароля
echo "8. Смена пароля пользователем..."
curl -s -X PATCH http://localhost:3001/users/profile/password \
  -H "Authorization: Bearer $USER_TOKEN" \
  -H "Content-Type: application/json" \
  -d "{
    \"currentPassword\": \"$TEMP_PASSWORD\",
    \"newPassword\": \"new_secure_password_123\"
  }" > /dev/null
echo "✅ Пароль изменён"

# Сброс пароля админом
echo "9. Сброс пароля администратором..."
RESET_RESPONSE=$(curl -s -X POST http://localhost:3001/users/admin/$USER_ID/reset-password \
  -H "Authorization: Bearer $ADMIN_TOKEN")
NEW_TEMP_PASSWORD=$(echo $RESET_RESPONSE | jq -r '.password')
echo "✅ Пароль сброшен: $NEW_TEMP_PASSWORD"

# Мягкое удаление
echo "10. Мягкое удаление пользователя..."
curl -s -X DELETE http://localhost:3001/users/admin/$USER_ID/soft \
  -H "Authorization: Bearer $ADMIN_TOKEN" > /dev/null
echo "✅ Пользователь мягко удалён"

# Проверка статистики
echo "11. Проверка статистики..."
STATS_RESPONSE=$(curl -s -X GET http://localhost:3001/users/admin/stats \
  -H "Authorization: Bearer $ADMIN_TOKEN")
echo "📊 Статистика: $(echo $STATS_RESPONSE | jq -c .)"

echo "🎉 Все тесты пройдены успешно!"
```

### Тест производительности

```bash
#!/bin/bash
# performance-test.sh

echo "=== Тест производительности ==="

ADMIN_TOKEN=$(curl -s -X POST http://localhost:3001/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "admin@goszalupa.ru", "password": "admin123456"}' \
  | jq -r '.accessToken')

# Тест времени отклика для получения списка пользователей
echo "Тестирование времени отклика..."
for i in {1..10}; do
  start_time=$(date +%s%N)
  curl -s -X GET http://localhost:3001/users/admin/all \
    -H "Authorization: Bearer $ADMIN_TOKEN" > /dev/null
  end_time=$(date +%s%N)
  
  duration=$(( (end_time - start_time) / 1000000 ))
  echo "Запрос $i: ${duration}ms"
done
```

---

## Troubleshooting Scripts

### Проверка состояния системы

```bash
#!/bin/bash
# system-check.sh

echo "=== Проверка состояния системы ==="

# Проверка доступности API
echo "1. Проверка доступности API..."
if curl -s http://localhost:3001/ > /dev/null; then
  echo "✅ API доступен"
else
  echo "❌ API недоступен"
  exit 1
fi

# Проверка админа
echo "2. Проверка учетной записи администратора..."
ADMIN_RESPONSE=$(curl -s -X POST http://localhost:3001/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "admin@goszalupa.ru", "password": "admin123456"}')

if echo $ADMIN_RESPONSE | jq -e '.accessToken' > /dev/null; then
  echo "✅ Админ доступен"
else
  echo "❌ Проблемы с админом"
  echo $ADMIN_RESPONSE
fi

# Проверка статистики
echo "3. Проверка статистики пользователей..."
ADMIN_TOKEN=$(echo $ADMIN_RESPONSE | jq -r '.accessToken')
STATS=$(curl -s -X GET http://localhost:3001/users/admin/stats \
  -H "Authorization: Bearer $ADMIN_TOKEN")

echo "📊 Статистика: $STATS"

echo "✅ Проверка завершена"
```

### Очистка тестовых данных

```bash
#!/bin/bash
# cleanup-test-data.sh

echo "=== Очистка тестовых данных ==="

ADMIN_TOKEN=$(curl -s -X POST http://localhost:3001/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "admin@goszalupa.ru", "password": "admin123456"}' \
  | jq -r '.accessToken')

# Получение всех пользователей
ALL_USERS=$(curl -s -X GET http://localhost:3001/users/admin/all \
  -H "Authorization: Bearer $ADMIN_TOKEN")

# Удаление тестовых пользователей
echo $ALL_USERS | jq -r '.[] | select(.email | test("test|example")) | .id' | while read user_id; do
  echo "Удаление тестового пользователя: $user_id"
  curl -s -X DELETE http://localhost:3001/users/admin/$user_id/soft \
    -H "Authorization: Bearer $ADMIN_TOKEN" > /dev/null
done

echo "✅ Тестовые данные очищены"
```

---

## Интеграционные тесты

### Jest тесты (TypeScript)

```typescript
// admin-functions.e2e.spec.ts
import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';

describe('Admin Functions (e2e)', () => {
  let app: INestApplication;
  let adminToken: string;

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();

    // Получение токена админа
    const loginResponse = await request(app.getHttpServer())
      .post('/auth/login')
      .send({
        email: 'admin@goszalupa.ru',
        password: 'admin123456'
      });

    adminToken = loginResponse.body.accessToken;
  });

  it('/users/admin/stats (GET)', () => {
    return request(app.getHttpServer())
      .get('/users/admin/stats')
      .set('Authorization', `Bearer ${adminToken}`)
      .expect(200)
      .expect((res) => {
        expect(res.body).toHaveProperty('total');
        expect(res.body).toHaveProperty('active');
        expect(res.body).toHaveProperty('inactive');
        expect(res.body).toHaveProperty('archived');
      });
  });

  it('/users/admin/all (GET)', () => {
    return request(app.getHttpServer())
      .get('/users/admin/all')
      .set('Authorization', `Bearer ${adminToken}`)
      .expect(200)
      .expect((res) => {
        expect(Array.isArray(res.body)).toBe(true);
      });
  });
});
```

Эта документация покрывает все аспекты новых административных функций с практическими примерами и тестовыми сценариями.
