#!/bin/bash

# Тест API endpoints

echo "=== Тестирование API ==="

# Проверка health check
echo "1. Проверка доступности сервера..."
curl -s http://localhost:3000/ || echo "Сервер недоступен"

echo -e "\n2. Регистрация нового пользователя..."
REGISTER_RESPONSE=$(curl -s -X POST http://localhost:3000/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email": "test@example.com", "password": "password123"}' \
  -c cookies.txt)
echo $REGISTER_RESPONSE

echo -e "\n3. Вход в систему..."
LOGIN_RESPONSE=$(curl -s -X POST http://localhost:3000/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "test@example.com", "password": "password123"}' \
  -c cookies.txt)
echo $LOGIN_RESPONSE

# Извлечение токена из ответа
ACCESS_TOKEN=$(echo $LOGIN_RESPONSE | grep -o '"accessToken":"[^"]*"' | cut -d'"' -f4)

echo -e "\n4. Получение профиля пользователя..."
curl -s -X GET http://localhost:3000/users/profile \
  -H "Authorization: Bearer $ACCESS_TOKEN" \
  -b cookies.txt

echo -e "\n5. Обновление профиля пользователя..."
curl -s -X PATCH http://localhost:3000/users/profile \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $ACCESS_TOKEN" \
  -b cookies.txt \
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

echo -e "\n6. Получение информации о текущем пользователе через /auth/me..."
curl -s -X GET http://localhost:3000/auth/me \
  -H "Authorization: Bearer $ACCESS_TOKEN" \
  -b cookies.txt

echo -e "\n7. Обновление токена..."
curl -s -X POST http://localhost:3000/auth/refresh \
  -b cookies.txt

echo -e "\n8. Выход из системы..."
curl -s -X POST http://localhost:3000/auth/logout \
  -H "Authorization: Bearer $ACCESS_TOKEN" \
  -b cookies.txt

echo -e "\n=== Тестирование завершено ==="
