# GosZalupa - NestJS Authentication API

Проект на NestJS с PostgreSQL, TypeORM и JWT авторизацией с сессиями в куки.

## Функциональность

- ✅ Регистрация пользователей (email + password)
- ✅ Авторизация через JWT токены
- ✅ Сессии с ключами в HTTP-only куки
- ✅ Профиль пользователя с расширенными данными
- ✅ PostgreSQL + TypeORM
- ✅ Docker поддержка

## Структура базы данных

### Таблица `users`
- email (уникальный)
- password (хэшированный)
- lastName (Фамилия)
- firstName (Имя)
- middleName (Отчество)
- phone (Телефон)
- position (Должность)
- workplace (Место работы)
- department (Структурное подразделение)
- subjects (Преподаваемые предметы - массив)
- academicDegree (Ученая степень)

### Таблица `sessions`
- sessionKey (уникальный ключ сессии)
- accessToken (JWT токен доступа)
- refreshToken (JWT токен обновления)
- expiresAt (дата истечения)
- userId (связь с пользователем)

## API Endpoints

### Авторизация
- `POST /auth/register` - Регистрация пользователя
- `POST /auth/login` - Вход в систему
- `POST /auth/refresh` - Обновление токена
- `POST /auth/logout` - Выход из системы
- `GET /auth/me` - Информация о текущем пользователе

### Пользователи
- `GET /users/profile` - Получить профиль пользователя
- `PATCH /users/profile` - Обновить профиль пользователя
- `POST /users` - Создать пользователя

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
