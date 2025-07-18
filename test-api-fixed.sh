#!/bin/bash

# API тестирование для проверки исправления ошибок

BASE_URL="http://localhost:3001"

echo "=== Тестирование API GoS ==="
echo

# Тест базовых маршрутов без аутентификации (должны возвращать 401)
echo "1. Тестирование GET /programs (без аутентификации)"
curl -s -o /dev/null -w "HTTP Status: %{http_code}\n" "$BASE_URL/programs"
echo

echo "2. Тестирование GET /expertise (без аутентификации)"
curl -s -o /dev/null -w "HTTP Status: %{http_code}\n" "$BASE_URL/expertise"
echo

echo "3. Тестирование GET /recommendations (без аутентификации)"
curl -s -o /dev/null -w "HTTP Status: %{http_code}\n" "$BASE_URL/recommendations"
echo

echo "4. Тестирование GET /programs/statistics (без аутентификации)"
curl -s -o /dev/null -w "HTTP Status: %{http_code}\n" "$BASE_URL/programs/statistics"
echo

echo "5. Тестирование POST /programs (без аутентификации)"
curl -s -o /dev/null -w "HTTP Status: %{http_code}\n" -X POST "$BASE_URL/programs" \
  -H "Content-Type: application/json" \
  -d '{"title":"Test Program"}'
echo

# Тест корневого маршрута
echo "6. Тестирование GET / (корневой маршрут)"
response=$(curl -s "$BASE_URL/")
echo "Response: $response"
echo

echo "=== Тестирование завершено ==="
echo "Если все маршруты возвращают 401 Unauthorized, это означает, что ошибка с undefined roles исправлена"
echo "и аутентификация работает корректно."
