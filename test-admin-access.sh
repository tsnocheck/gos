#!/bin/bash

echo "Testing admin access to candidates..."

# Login as admin
echo "1. Logging in as admin..."
LOGIN_RESPONSE=$(curl -s -X POST "http://localhost:3001/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@goszalupa.ru","password":"admin123456"}')

echo "Login response: $LOGIN_RESPONSE"

# Extract token
TOKEN=$(echo $LOGIN_RESPONSE | grep -o '"access_token":"[^"]*"' | cut -d'"' -f4)

echo "Extracted token: $TOKEN"

if [ -z "$TOKEN" ]; then
  echo "Failed to get admin token. Checking if admin user exists..."
  exit 1
fi

# Test access to candidates
echo "2. Testing access to candidates..."
CANDIDATES_RESPONSE=$(curl -s -X GET "http://localhost:3001/candidates" \
  -H "Authorization: $TOKEN" \
  -H "Content-Type: application/json")

echo "Candidates response: $CANDIDATES_RESPONSE"

# Test creating a test candidate first
echo "3. Creating a test candidate..."
TEST_CANDIDATE_RESPONSE=$(curl -s -X POST "http://localhost:3001/auth/register-candidate" \
  -H "Content-Type: application/json" \
  -d '{
    "firstName": "Тест",
    "lastName": "Кандидат",
    "email": "test@example.com",
    "phone": "+7 999 999 9999",
    "workplace": "Тестовая организация",
    "department": "Тестовый отдел",
    "subjects": ["Математика", "Физика"],
    "academicDegree": "candidate"
  }')

echo "Test candidate response: $TEST_CANDIDATE_RESPONSE"

# Try getting candidates again
echo "4. Getting candidates again..."
CANDIDATES_RESPONSE2=$(curl -s -X GET "http://localhost:3001/candidates" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json")

echo "Candidates response 2: $CANDIDATES_RESPONSE2"
