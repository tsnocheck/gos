# Тест API endpoints для PowerShell

Write-Host "=== Тестирование API ===" -ForegroundColor Green

# Проверка health check
Write-Host "1. Проверка доступности сервера..." -ForegroundColor Yellow
try {
    $response = Invoke-RestMethod -Uri "http://localhost:3001/" -Method Get
    Write-Host "Сервер доступен: $response" -ForegroundColor Green
} catch {
    Write-Host "Сервер недоступен: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host "`n2. Вход администратора..." -ForegroundColor Yellow
$adminLoginBody = @{
    email = "admin@goszalupa.ru"
    password = "admin123456"
} | ConvertTo-Json

try {
    $adminResponse = Invoke-RestMethod -Uri "http://localhost:3001/auth/login" -Method Post -Body $adminLoginBody -ContentType "application/json" -SessionVariable session
    Write-Host "Вход администратора успешен: $($adminResponse | ConvertTo-Json)" -ForegroundColor Green
    $adminToken = $adminResponse.accessToken
} catch {
    Write-Host "Ошибка входа администратора: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host "`n3. Регистрация нового пользователя..." -ForegroundColor Yellow
$registerBody = @{
    email = "test@example.com"
    password = "password123"
} | ConvertTo-Json

try {
    $registerResponse = Invoke-RestMethod -Uri "http://localhost:3001/auth/register" -Method Post -Body $registerBody -ContentType "application/json"
    Write-Host "Регистрация успешна: $($registerResponse | ConvertTo-Json)" -ForegroundColor Green
} catch {
    Write-Host "Ошибка регистрации: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host "`n4. Вход в систему..." -ForegroundColor Yellow
$loginBody = @{
    email = "test@example.com"
    password = "password123"
} | ConvertTo-Json

try {
    $loginResponse = Invoke-RestMethod -Uri "http://localhost:3001/auth/login" -Method Post -Body $loginBody -ContentType "application/json" -WebSession $session
    Write-Host "Вход успешен: $($loginResponse | ConvertTo-Json)" -ForegroundColor Green
    $accessToken = $loginResponse.accessToken
} catch {
    Write-Host "Ошибка входа: $($_.Exception.Message)" -ForegroundColor Red
}

if ($accessToken) {
    $headers = @{
        "Authorization" = "Bearer $accessToken"
    }

    Write-Host "`n4. Получение профиля пользователя..." -ForegroundColor Yellow
    try {
        $profileResponse = Invoke-RestMethod -Uri "http://localhost:3001/users/profile" -Method Get -Headers $headers -WebSession $session
        Write-Host "Профиль: $($profileResponse | ConvertTo-Json)" -ForegroundColor Green
    } catch {
        Write-Host "Ошибка получения профиля: $($_.Exception.Message)" -ForegroundColor Red
    }

    Write-Host "`n5. Обновление профиля пользователя..." -ForegroundColor Yellow
    $updateBody = @{
        firstName = "Иван"
        lastName = "Иванов"
        middleName = "Иванович"
        phone = "+7900123456"
        position = "Преподаватель"
        workplace = "МГУ"
        department = "Физический факультет"
        subjects = @("Физика", "Математика")
        academicDegree = "Кандидат физических наук"
    } | ConvertTo-Json

    try {
        $updateResponse = Invoke-RestMethod -Uri "http://localhost:3001/users/profile" -Method Patch -Body $updateBody -ContentType "application/json" -Headers $headers -WebSession $session
        Write-Host "Профиль обновлен: $($updateResponse | ConvertTo-Json)" -ForegroundColor Green
    } catch {
        Write-Host "Ошибка обновления профиля: $($_.Exception.Message)" -ForegroundColor Red
    }

    Write-Host "`n6. Получение информации о текущем пользователе через /auth/me..." -ForegroundColor Yellow
    try {
        $meResponse = Invoke-RestMethod -Uri "http://localhost:3001/auth/me" -Method Get -Headers $headers -WebSession $session
        Write-Host "Информация о пользователе: $($meResponse | ConvertTo-Json)" -ForegroundColor Green
    } catch {
        Write-Host "Ошибка получения информации о пользователе: $($_.Exception.Message)" -ForegroundColor Red
    }

    Write-Host "`n7. Обновление токена..." -ForegroundColor Yellow
    try {
        $refreshResponse = Invoke-RestMethod -Uri "http://localhost:3001/auth/refresh" -Method Post -WebSession $session
        Write-Host "Токен обновлен: $($refreshResponse | ConvertTo-Json)" -ForegroundColor Green
    } catch {
        Write-Host "Ошибка обновления токена: $($_.Exception.Message)" -ForegroundColor Red
    }

    Write-Host "`n8. Выход из системы..." -ForegroundColor Yellow
    try {
        $logoutResponse = Invoke-RestMethod -Uri "http://localhost:3001/auth/logout" -Method Post -Headers $headers -WebSession $session
        Write-Host "Выход успешен: $($logoutResponse | ConvertTo-Json)" -ForegroundColor Green
    } catch {
        Write-Host "Ошибка выхода: $($_.Exception.Message)" -ForegroundColor Red
    }
}

Write-Host "`n=== Тестирование завершено ===" -ForegroundColor Green
