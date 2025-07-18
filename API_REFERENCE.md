# API Reference - Административные функции

## Quick Reference

### Аутентификация
Все эндпоинты требуют JWT токен в заголовке:
```
Authorization: Bearer <token>
```

---

## 🔐 Admin Endpoints (требуют роль ADMIN)

### Users Management

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/users/admin/all` | Список всех пользователей |
| `GET` | `/users/admin/stats` | Статистика пользователей |
| `PATCH` | `/users/admin/:id` | Редактирование пользователя |
| `PATCH` | `/users/admin/:id/status` | Изменение статуса |
| `DELETE` | `/users/admin/:id/soft` | Мягкое удаление |
| `DELETE` | `/users/admin/:id/hard` | Жёсткое удаление |
| `POST` | `/users/admin/:id/reset-password` | Сброс пароля |

---

## 👤 User Profile Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/users/profile` | Получить свой профиль |
| `PATCH` | `/users/profile` | Редактировать профиль |
| `PATCH` | `/users/profile/password` | Сменить пароль |

---

## 📊 Response Examples

### GET /users/admin/stats
```json
{
  "total": 10,
  "active": 8,
  "inactive": 2,
  "archived": 0
}
```

### POST /users/admin/:id/reset-password
```json
{
  "password": "temp_password_123",
  "user": {
    "id": "uuid",
    "email": "user@example.com"
  }
}
```

---

## 🔧 Request Examples

### PATCH /users/admin/:id
```json
{
  "firstName": "Новое имя",
  "lastName": "Новая фамилия",
  "position": "Старший разработчик",
  "roles": ["expert"],
  "status": "active"
}
```

### PATCH /users/profile/password
```json
{
  "currentPassword": "old_password",
  "newPassword": "new_password"
}
```

---

## ⚠️ Error Codes

| Code | Message | Description |
|------|---------|-------------|
| `401` | Unauthorized | Неверный токен |
| `403` | Forbidden | Недостаточно прав |
| `404` | Not Found | Пользователь не найден |
| `400` | Bad Request | Неверные данные |

---

## 🚀 Quick Start

1. **Получить токен админа:**
```bash
curl -X POST http://localhost:3001/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "admin@goszalupa.ru", "password": "admin123456"}'
```

2. **Получить список пользователей:**
```bash
curl -X GET http://localhost:3001/users/admin/all \
  -H "Authorization: Bearer <token>"
```

3. **Мягкое удаление пользователя:**
```bash
curl -X DELETE http://localhost:3001/users/admin/<user_id>/soft \
  -H "Authorization: Bearer <token>"
```
