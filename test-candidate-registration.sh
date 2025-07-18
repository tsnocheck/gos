#!/bin/bash

BASE_URL="http://localhost:3001"

echo "=== Тестирование системы регистрации кандидатов ==="

echo -e "\n1. Регистрация кандидата (публичная)"
curl -X POST "${BASE_URL}/auth/register-candidate" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test.candidate@example.com",
    "firstName": "Иван",
    "lastName": "Иванов",
    "middleName": "Иванович",
    "phone": "+7-123-456-7890",
    "position": "Преподаватель",
    "workplace": "МГУ",
    "department": "Математика",
    "subjects": ["Алгебра", "Геометрия"],
    "academicDegree": "Кандидат наук"
  }'

echo -e "\n\n2. Вход админа для получения токена"
ADMIN_RESPONSE=$(curl -s -X POST "${BASE_URL}/auth/login" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@goszalupa.ru",
    "password": "admin123456"
  }')

echo "Admin response: $ADMIN_RESPONSE"

# Извлекаем токен из ответа
ADMIN_TOKEN=$(echo $ADMIN_RESPONSE | grep -o '"accessToken":"[^"]*"' | cut -d'"' -f4)

if [ -n "$ADMIN_TOKEN" ]; then
  echo "Admin token получен: ${ADMIN_TOKEN:0:20}..."
  
  echo -e "\n\n3. Получение списка кандидатов"
  curl -X GET "${BASE_URL}/candidates" \
    -H "Authorization: Bearer $ADMIN_TOKEN"
  
  echo -e "\n\n4. Получение статистики кандидатов"
  curl -X GET "${BASE_URL}/candidates/stats" \
    -H "Authorization: Bearer $ADMIN_TOKEN"
else
  echo "Не удалось получить токен админа. Проверьте, что пользователь admin@example.com существует в системе."
fi

echo -e "\n\n=== Тест завершен ==="
