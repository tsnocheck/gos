#!/bin/bash

# Скрипт для комплексного тестирования админских функций

echo "=== Тестирование административных функций ==="

# Логин админа
echo "1. Логин админа..."
ADMIN_RESPONSE=$(curl -s -X POST http://localhost:3001/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "admin@goszalupa.ru", "password": "admin123456"}')

ADMIN_TOKEN=$(echo $ADMIN_RESPONSE | grep -o '"accessToken":"[^"]*' | cut -d'"' -f4)

if [ -z "$ADMIN_TOKEN" ]; then
  echo "❌ Не удалось получить токен админа"
  exit 1
fi

echo "✅ Токен админа получен"

# Проверяем список пользователей
echo "2. Получение списка всех пользователей..."
curl -s -X GET http://localhost:3001/users/admin/all \
  -H "Authorization: Bearer $ADMIN_TOKEN" | jq '.'

# Проверяем статистику
echo "3. Получение статистики пользователей..."
curl -s -X GET http://localhost:3001/users/admin/stats \
  -H "Authorization: Bearer $ADMIN_TOKEN" | jq '.'

# Создаем нового кандидата для тестирования
echo "4. Создание нового кандидата..."
CANDIDATE_RESPONSE=$(curl -s -X POST http://localhost:3001/auth/register-candidate \
  -H "Content-Type: application/json" \
  -d '{
    "email": "demo.user@example.com",
    "firstName": "Демо",
    "lastName": "Пользователь",
    "middleName": "Тестович",
    "phone": "+7-555-123-4567",
    "position": "Менеджер",
    "workplace": "ООО Демо",
    "department": "Продажи",
    "subjects": ["Маркетинг"],
    "academicDegree": "Магистр",
    "proposedRoles": ["author"]
  }')

CANDIDATE_ID=$(echo $CANDIDATE_RESPONSE | grep -o '"candidateId":"[^"]*' | cut -d'"' -f4)

if [ -z "$CANDIDATE_ID" ]; then
  echo "❌ Не удалось создать кандидата"
  exit 1
fi

echo "✅ Кандидат создан: $CANDIDATE_ID"

# Одобряем кандидата
echo "5. Одобрение кандидата..."
APPROVE_RESPONSE=$(curl -s -X POST http://localhost:3001/candidates/$CANDIDATE_ID/approve \
  -H "Authorization: Bearer $ADMIN_TOKEN")

echo $APPROVE_RESPONSE | jq '.'

USER_ID=$(echo $APPROVE_RESPONSE | grep -o '"id":"[^"]*' | cut -d'"' -f4)

if [ -z "$USER_ID" ]; then
  echo "❌ Не удалось получить ID пользователя"
  exit 1
fi

echo "✅ Пользователь создан: $USER_ID"

# Тестируем редактирование пользователя админом
echo "6. Редактирование пользователя админом..."
curl -s -X PATCH http://localhost:3001/users/admin/$USER_ID \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "position": "Старший менеджер",
    "workplace": "ООО Новая Компания",
    "roles": ["expert"]
  }' | jq '.'

# Мягкое удаление пользователя
echo "7. Мягкое удаление пользователя..."
curl -s -X DELETE http://localhost:3001/users/admin/$USER_ID/soft \
  -H "Authorization: Bearer $ADMIN_TOKEN" | jq '.'

# Проверяем обновленную статистику
echo "8. Обновленная статистика..."
curl -s -X GET http://localhost:3001/users/admin/stats \
  -H "Authorization: Bearer $ADMIN_TOKEN" | jq '.'

echo "=== Тестирование завершено ==="
