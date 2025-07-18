# Руководство по административным функциям

## Обзор

Система включает расширенные административные возможности для управления пользователями. Администраторы могут управлять учетными записями пользователей, а пользователи могут редактировать свои профили.

## Роли и права доступа

### Роли пользователей
- `admin` - администратор системы (полный доступ)
- `expert` - эксперт (ограниченный доступ)  
- `author` - автор программ (базовый доступ)

### Система безопасности
- **JWT аутентификация** с проверкой сессий
- **Ролевая авторизация** через декоратор `@Roles()`
- **Хэширование паролей** с использованием bcrypt
- **Валидация данных** через DTO

## API Endpoints

### 🔧 Административные функции (требуют роль ADMIN)

#### 1. Получение списка всех пользователей
```http
GET /users/admin/all
Authorization: Bearer <admin_token>
```

**Ответ:**
```json
[
  {
    "id": "uuid",
    "email": "user@example.com",
    "firstName": "Имя",
    "lastName": "Фамилия",
    "roles": ["expert"],
    "status": "active",
    "createdAt": "2025-07-18T09:00:00.000Z"
  }
]
```

#### 2. Статистика пользователей
```http
GET /users/admin/stats
Authorization: Bearer <admin_token>
```

**Ответ:**
```json
{
  "total": 10,
  "active": 8,
  "inactive": 2,
  "archived": 0
}
```

#### 3. Редактирование пользователя
```http
PATCH /users/admin/:id
Authorization: Bearer <admin_token>
Content-Type: application/json

{
  "firstName": "Новое имя",
  "lastName": "Новая фамилия", 
  "position": "Новая должность",
  "workplace": "Новое место работы",
  "roles": ["expert", "author"],
  "status": "active"
}
```

#### 4. Изменение статуса пользователя
```http
PATCH /users/admin/:id/status
Authorization: Bearer <admin_token>
Content-Type: application/json

{
  "status": "inactive"
}
```

**Доступные статусы:**
- `active` - активный
- `inactive` - неактивный  
- `archived` - архивированный
- `hidden` - скрытый

#### 5. Мягкое удаление пользователя
```http
DELETE /users/admin/:id/soft
Authorization: Bearer <admin_token>
```

Изменяет статус пользователя на `inactive`. Пользователь остается в базе данных, но не может войти в систему.

#### 6. Жёсткое удаление пользователя
```http
DELETE /users/admin/:id/hard
Authorization: Bearer <admin_token>
```

⚠️ **Внимание:** Полностью удаляет пользователя из базы данных. Операция необратима!

#### 7. Сброс пароля пользователя
```http
POST /users/admin/:id/reset-password
Authorization: Bearer <admin_token>
```

**Ответ:**
```json
{
  "password": "temp_password_123",
  "user": {
    "id": "uuid",
    "email": "user@example.com"
  }
}
```

### 👤 Функции пользователя

#### 1. Получение своего профиля
```http
GET /users/profile
Authorization: Bearer <user_token>
```

#### 2. Редактирование своего профиля
```http
PATCH /users/profile
Authorization: Bearer <user_token>
Content-Type: application/json

{
  "firstName": "Новое имя",
  "lastName": "Новая фамилия",
  "middleName": "Отчество",
  "phone": "+7-999-123-45-67",
  "position": "Должность",
  "workplace": "Место работы",
  "department": "Отдел",
  "subjects": ["Предмет1", "Предмет2"],
  "academicDegree": "Ученая степень"
}
```

#### 3. Смена пароля
```http
PATCH /users/profile/password
Authorization: Bearer <user_token>
Content-Type: application/json

{
  "currentPassword": "текущий_пароль",
  "newPassword": "новый_пароль"
}
```

## Примеры использования

### Bash скрипты для тестирования

#### Получение токена администратора
```bash
ADMIN_TOKEN=$(curl -s -X POST http://localhost:3001/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "admin@goszalupa.ru", "password": "admin123456"}' \
  | grep -o '"accessToken":"[^"]*' | cut -d'"' -f4)
```

#### Получение списка пользователей
```bash
curl -X GET http://localhost:3001/users/admin/all \
  -H "Authorization: Bearer $ADMIN_TOKEN"
```

#### Редактирование пользователя
```bash
curl -X PATCH http://localhost:3001/users/admin/$USER_ID \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "position": "Старший разработчик",
    "roles": ["expert"]
  }'
```

#### Мягкое удаление пользователя
```bash
curl -X DELETE http://localhost:3001/users/admin/$USER_ID/soft \
  -H "Authorization: Bearer $ADMIN_TOKEN"
```

### JavaScript/TypeScript примеры

#### Получение статистики пользователей
```typescript
const getUsersStats = async (token: string) => {
  const response = await fetch('/users/admin/stats', {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });
  return response.json();
};
```

#### Редактирование профиля пользователя
```typescript
const updateProfile = async (token: string, data: UpdateUserDto) => {
  const response = await fetch('/users/profile', {
    method: 'PATCH',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(data)
  });
  return response.json();
};
```

## Структура данных

### DTO для редактирования администратором

```typescript
interface AdminUpdateUserDto {
  email?: string;
  firstName?: string;
  lastName?: string;
  middleName?: string;
  phone?: string;
  organization?: string;
  position?: string;
  roles?: UserRole[];
  status?: UserStatus;
}
```

### DTO для редактирования профиля
```typescript
interface UpdateUserDto {
  firstName?: string;
  lastName?: string;
  middleName?: string;
  phone?: string;
  position?: string;
  workplace?: string;
  department?: string;
  subjects?: string[];
  academicDegree?: string;
}
```

### DTO для смены пароля
```typescript
interface ChangePasswordDto {
  currentPassword: string;
  newPassword: string; // минимум 6 символов
}
```

## Коды ошибок

| Код | Описание | Причина |
|-----|----------|---------|
| 401 | Unauthorized | Неверный или истёкший токен |
| 403 | Forbidden | Недостаточно прав доступа |
| 404 | Not Found | Пользователь не найден |
| 400 | Bad Request | Неверные данные в запросе |
| 500 | Internal Server Error | Внутренняя ошибка сервера |

## Безопасность

### Рекомендации по безопасности

1. **Регулярная смена паролей** - особенно для администраторов
2. **Использование сильных паролей** - минимум 6 символов
3. **Мониторинг активности** - отслеживание административных действий
4. **Ограничение времени сессий** - JWT токены имеют срок действия
5. **Резервное копирование** - перед массовыми операциями

### Логирование
Все административные действия логируются для аудита:
- Изменения пользователей
- Смена статусов
- Сброс паролей
- Удаление учетных записей

## Интеграция с системой кандидатов

Административные функции интегрированы с системой регистрации кандидатов:

1. **Регистрация кандидата** → `POST /auth/register-candidate`
2. **Одобрение админом** → `POST /candidates/:id/approve` 
3. **Автоматическое создание пользователя** → генерация временного пароля
4. **Отправка уведомления** → email с данными для входа

## Устранение неполадок

### Проблема: "Invalid session"
- **Причина:** Истёк JWT токен
- **Решение:** Получить новый токен через `/auth/login`

### Проблема: "Forbidden" при доступе к админским функциям  
- **Причина:** Недостаточно прав или неправильная роль
- **Решение:** Проверить роль пользователя в базе данных

### Проблема: "User not found"
- **Причина:** Неверный ID пользователя
- **Решение:** Проверить корректность UUID

### Проблема: "Invalid current password"
- **Причина:** Неверный текущий пароль при смене
- **Решение:** Проверить правильность ввода пароля

## Мониторинг и метрики

### Ключевые метрики для мониторинга:
- Количество активных пользователей
- Частота смены паролей
- Количество заблокированных учетных записей
- Ошибки авторизации

### Рекомендуемые дашборды:
1. **Статистика пользователей** - `/users/admin/stats`
2. **Активность входов** - логи аутентификации
3. **Административные действия** - логи изменений

## Поддержка

При возникновении проблем:
1. Проверьте логи приложения
2. Убедитесь в корректности токенов
3. Проверьте роли пользователей
4. Обратитесь к системному администратору
