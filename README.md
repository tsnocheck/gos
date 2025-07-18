# GosZalupa - NestJS Authentication API

Проект на NestJS с PostgreSQL, TypeORM и JWT авторизацией с расширенными административными функциями.

## Основная функциональность

- ✅ Регистрация пользователей (email + password)
- ✅ Авторизация через JWT токены  
- ✅ Сессии с ключами в HTTP-only куки
- ✅ Профиль пользователя с расширенными данными
- ✅ **Система регистрации кандидатов с одобрением**
- ✅ **Административные функции управления пользователями**
- ✅ **Ролевая система доступа (admin, expert, author)**
- ✅ PostgreSQL + TypeORM
- ✅ Docker поддержка

## 🆕 Новые административные возможности

### Для администраторов:
- 🔧 **Управление пользователями** - просмотр, редактирование, удаление
- 📊 **Статистика пользователей** - подсчет по статусам
- 🔑 **Сброс паролей** - генерация временных паролей  
- 👥 **Массовые операции** - изменение статусов группы пользователей
- 📋 **Одобрение кандидатов** - создание пользователей из заявок

### Для пользователей:
- ✏️ **Редактирование профиля** - изменение личных данных
- 🔐 **Смена пароля** - с проверкой текущего пароля
- 👤 **Просмотр профиля** - полная информация об аккаунте

## Структура базы данных

### Таблица `users`
- email (уникальный)
- password (хэшированный)
- roles (массив ролей: admin, expert, author)
- status (active, inactive, archived, hidden)
- lastName, firstName, middleName
- phone, position, workplace, department
- subjects (массив), academicDegree
- invitationToken, invitationExpiresAt

### Таблица `candidates` 
- email, firstName, lastName, middleName
- phone, workplace, department, subjects
- academicDegree, proposedRoles
- status (pending, approved, rejected)
- invitedById, registeredUserId

### Таблица `sessions`
- sessionKey, accessToken, refreshToken
- expiresAt, userId

## API Endpoints

### 🔐 Авторизация
- `POST /auth/register` - Регистрация пользователя
- `POST /auth/login` - Вход в систему  
- `POST /auth/refresh` - Обновление токена
- `POST /auth/logout` - Выход из системы
- `GET /auth/me` - Информация о текущем пользователе
- `POST /auth/register-candidate` - 🆕 Регистрация кандидата

### 👤 Профиль пользователя
- `GET /users/profile` - Получить профиль
- `PATCH /users/profile` - 🆕 Обновить профиль
- `PATCH /users/profile/password` - 🆕 Сменить пароль

### 🔧 Административные функции (требуют роль ADMIN)
- `GET /users/admin/all` - 🆕 Список всех пользователей
- `GET /users/admin/stats` - 🆕 Статистика пользователей
- `PATCH /users/admin/:id` - 🆕 Редактирование пользователя
- `PATCH /users/admin/:id/status` - 🆕 Изменение статуса
- `DELETE /users/admin/:id/soft` - 🆕 Мягкое удаление
- `DELETE /users/admin/:id/hard` - 🆕 Жёсткое удаление
- `POST /users/admin/:id/reset-password` - 🆕 Сброс пароля

### 📋 Управление кандидатами (требуют роль ADMIN)
- `GET /candidates` - Список кандидатов
- `POST /candidates/:id/approve` - 🆕 Одобрение кандидата
- `PUT /candidates/:id/reject` - Отклонение кандидата
- `GET /candidates/stats` - Статистика кандидатов

## Установка и запуск

### Локальная разработка

1. Установить зависимости:
```bash
npm install
```

2. Настроить переменные окружения в `.env`:
```env
DB_HOST=localhost
DB_PORT=5432
DB_USERNAME=postgres
DB_PASSWORD=password
DB_NAME=goszalupa
JWT_SECRET=your-super-secret-jwt-key
SESSION_SECRET=your-super-secret-session-key
```

3. Запустить PostgreSQL локально или через Docker:
```bash
docker run --name postgres-gos -e POSTGRES_DB=goszalupa -e POSTGRES_USER=postgres -e POSTGRES_PASSWORD=password -p 5432:5432 -d postgres:15-alpine
```

4. Запустить приложение в режиме разработки:
```bash
npm run start:dev
```

### Docker

1. Запустить полный стек с Docker Compose:
```bash
docker-compose up -d
```

## Примеры использования

### Регистрация
```bash
curl -X POST http://localhost:3000/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email": "user@example.com", "password": "password123"}'
```

### Вход
```bash
curl -X POST http://localhost:3000/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "user@example.com", "password": "password123"}'
```

### Обновление профиля
```bash
curl -X PATCH http://localhost:3000/users/profile \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -d '{
    "firstName": "Иван",
    "lastName": "Иванов",
    "middleName": "Иванович",
    "phone": "+7900123456",
    "position": "Преподаватель",
    "workplace": "МГУ",
    "department": "Физический факультет",
    "subjects": ["Физика", "Математика"],
    "academicDegree": "Кандидат физических наук"
  }'
```

## Безопасность

- Пароли хэшируются с помощью bcrypt
- JWT токены имеют короткое время жизни (15 минут)
- Session key хранится в HTTP-only куки
- CORS настроен для безопасной работы
- Используется валидация данных с class-validator

## Технологии

- **NestJS** - Node.js фреймворк
- **TypeORM** - ORM для работы с базой данных
- **PostgreSQL** - База данных
- **JWT** - Токены авторизации
- **bcrypt** - Хэширование паролей
- **Docker** - Контейнеризация
- **class-validator** - Валидация данных

## Project setup

```bash
$ npm install
```

## Compile and run the project

```bash
# development
$ npm run start

# watch mode
$ npm run start:dev

# production mode
$ npm run start:prod
```

## Run tests

```bash
# unit tests
$ npm run test

# e2e tests
$ npm run test:e2e

# test coverage
$ npm run test:cov
```

## 📚 Документация

### Подробные руководства:
- **[Административные функции](./ADMIN_FUNCTIONS_GUIDE.md)** - Полное руководство по управлению пользователями
- **[API Reference](./API_REFERENCE.md)** - Краткий справочник по всем эндпоинтам
- **[Примеры и тестирование](./EXAMPLES_AND_TESTING.md)** - Сценарии использования и тестовые скрипты

### Быстрый старт для администраторов:

1. **Получить токен админа:**
```bash
curl -X POST http://localhost:3001/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "admin@goszalupa.ru", "password": "admin123456"}'
```

2. **Просмотр статистики пользователей:**
```bash
curl -X GET http://localhost:3001/users/admin/stats \
  -H "Authorization: Bearer <admin_token>"
```

3. **Одобрение кандидата:**
```bash
curl -X POST http://localhost:3001/candidates/<candidate_id>/approve \
  -H "Authorization: Bearer <admin_token>"
```

## 🔐 Роли и безопасность

- **admin** - Полный доступ ко всем функциям
- **expert** - Доступ к экспертным функциям  
- **author** - Базовый доступ для авторов программ

Все административные функции защищены JWT токенами и ролевой авторизацией.

## Deployment

When you're ready to deploy your NestJS application to production, there are some key steps you can take to ensure it runs as efficiently as possible. Check out the [deployment documentation](https://docs.nestjs.com/deployment) for more information.

If you are looking for a cloud-based platform to deploy your NestJS application, check out [Mau](https://mau.nestjs.com), our official platform for deploying NestJS applications on AWS. Mau makes deployment straightforward and fast, requiring just a few simple steps:

```bash
$ npm install -g @nestjs/mau
$ mau deploy
```

With Mau, you can deploy your application in just a few clicks, allowing you to focus on building features rather than managing infrastructure.

## Resources

Check out a few resources that may come in handy when working with NestJS:

- Visit the [NestJS Documentation](https://docs.nestjs.com) to learn more about the framework.
- For questions and support, please visit our [Discord channel](https://discord.gg/G7Qnnhy).
- To dive deeper and get more hands-on experience, check out our official video [courses](https://courses.nestjs.com/).
- Deploy your application to AWS with the help of [NestJS Mau](https://mau.nestjs.com) in just a few clicks.
- Visualize your application graph and interact with the NestJS application in real-time using [NestJS Devtools](https://devtools.nestjs.com).
- Need help with your project (part-time to full-time)? Check out our official [enterprise support](https://enterprise.nestjs.com).
- To stay in the loop and get updates, follow us on [X](https://x.com/nestframework) and [LinkedIn](https://linkedin.com/company/nestjs).
- Looking for a job, or have a job to offer? Check out our official [Jobs board](https://jobs.nestjs.com).

## Support

Nest is an MIT-licensed open source project. It can grow thanks to the sponsors and support by the amazing backers. If you'd like to join them, please [read more here](https://docs.nestjs.com/support).

## Stay in touch

- Author - [Kamil Myśliwiec](https://twitter.com/kammysliwiec)
- Website - [https://nestjs.com](https://nestjs.com/)
- Twitter - [@nestframework](https://twitter.com/nestframework)

## License

Nest is [MIT licensed](https://github.com/nestjs/nest/blob/master/LICENSE).
