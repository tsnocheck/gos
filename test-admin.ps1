# Тест административных функций API для PowerShell

Write-Host "=== Тестирование административных функций ===" -ForegroundColor Green

# Данные администратора
$adminEmail = "admin@goszalupa.ru"
$adminPassword = "admin123456"

Write-Host "`n1. Вход администратора..." -ForegroundColor Yellow
$adminLoginBody = @{
    email = $adminEmail
    password = $adminPassword
} | ConvertTo-Json

try {
    $adminLoginResponse = Invoke-RestMethod -Uri "http://localhost:3001/auth/login" -Method Post -Body $adminLoginBody -ContentType "application/json" -SessionVariable adminSession
    Write-Host "✅ Администратор вошел в систему" -ForegroundColor Green
    $adminToken = $adminLoginResponse.accessToken
    $adminHeaders = @{
        "Authorization" = "Bearer $adminToken"
    }
} catch {
    Write-Host "❌ Ошибка входа администратора: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}

Write-Host "`n2. Создание пользователя администратором..." -ForegroundColor Yellow
$createUserBody = @{
    email = "newuser@example.com"
    firstName = "Иван"
    lastName = "Тестовый"
    role = "author"
} | ConvertTo-Json

try {
    $createUserResponse = Invoke-RestMethod -Uri "http://localhost:3001/admin/users" -Method Post -Body $createUserBody -ContentType "application/json" -Headers $adminHeaders -WebSession $adminSession
    Write-Host "✅ Пользователь создан: $($createUserResponse.email)" -ForegroundColor Green
    $newUserId = $createUserResponse.id
} catch {
    Write-Host "❌ Ошибка создания пользователя: $($_.Exception.Message)" -ForegroundColor Red
}

if ($newUserId) {
    Write-Host "`n3. Одобрение пользователя..." -ForegroundColor Yellow
    try {
        $approveResponse = Invoke-RestMethod -Uri "http://localhost:3001/admin/users/$newUserId/approve" -Method Post -Headers $adminHeaders -WebSession $adminSession
        Write-Host "✅ Пользователь одобрен" -ForegroundColor Green
    } catch {
        Write-Host "❌ Ошибка одобрения пользователя: $($_.Exception.Message)" -ForegroundColor Red
    }

    Write-Host "`n4. Смена роли пользователя..." -ForegroundColor Yellow
    $changeRoleBody = @{
        userId = $newUserId
        role = "expert"
    } | ConvertTo-Json

    try {
        $roleResponse = Invoke-RestMethod -Uri "http://localhost:3001/admin/users/role" -Method Patch -Body $changeRoleBody -ContentType "application/json" -Headers $adminHeaders -WebSession $adminSession
        Write-Host "✅ Роль изменена на: $($roleResponse.role)" -ForegroundColor Green
    } catch {
        Write-Host "❌ Ошибка смены роли: $($_.Exception.Message)" -ForegroundColor Red
    }

    Write-Host "`n5. Редактирование данных пользователя..." -ForegroundColor Yellow
    $updateUserBody = @{
        firstName = "Иван"
        lastName = "Обновленный"
        position = "Эксперт"
        workplace = "Тестовая организация"
    } | ConvertTo-Json

    try {
        $updateResponse = Invoke-RestMethod -Uri "http://localhost:3001/admin/users/$newUserId" -Method Patch -Body $updateUserBody -ContentType "application/json" -Headers $adminHeaders -WebSession $adminSession
        Write-Host "✅ Данные пользователя обновлены" -ForegroundColor Green
    } catch {
        Write-Host "❌ Ошибка обновления данных: $($_.Exception.Message)" -ForegroundColor Red
    }

    Write-Host "`n6. Отправка приглашения для смены пароля..." -ForegroundColor Yellow
    try {
        $inviteResponse = Invoke-RestMethod -Uri "http://localhost:3001/admin/users/$newUserId/send-invitation" -Method Post -Headers $adminHeaders -WebSession $adminSession
        Write-Host "✅ Приглашение отправлено" -ForegroundColor Green
    } catch {
        Write-Host "❌ Ошибка отправки приглашения: $($_.Exception.Message)" -ForegroundColor Red
    }

    Write-Host "`n7. Архивирование пользователя..." -ForegroundColor Yellow
    try {
        $archiveResponse = Invoke-RestMethod -Uri "http://localhost:3001/admin/users/$newUserId/archive" -Method Post -Headers $adminHeaders -WebSession $adminSession
        Write-Host "✅ Пользователь архивирован" -ForegroundColor Green
    } catch {
        Write-Host "❌ Ошибка архивирования: $($_.Exception.Message)" -ForegroundColor Red
    }

    Write-Host "`n8. Возвращение из архива..." -ForegroundColor Yellow
    try {
        $unarchiveResponse = Invoke-RestMethod -Uri "http://localhost:3001/admin/users/$newUserId/unarchive" -Method Post -Headers $adminHeaders -WebSession $adminSession
        Write-Host "✅ Пользователь возвращен из архива" -ForegroundColor Green
    } catch {
        Write-Host "❌ Ошибка возвращения из архива: $($_.Exception.Message)" -ForegroundColor Red
    }
}

Write-Host "`n9. Получение всех пользователей..." -ForegroundColor Yellow
try {
    $allUsersResponse = Invoke-RestMethod -Uri "http://localhost:3001/admin/users" -Method Get -Headers $adminHeaders -WebSession $adminSession
    Write-Host "✅ Получено пользователей: $($allUsersResponse.Length)" -ForegroundColor Green
    foreach ($user in $allUsersResponse) {
        Write-Host "  - $($user.email) [$($user.role)] ($($user.status))" -ForegroundColor Cyan
    }
} catch {
    Write-Host "❌ Ошибка получения пользователей: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host "`n10. Получение неактивных пользователей..." -ForegroundColor Yellow
try {
    $pendingUsersResponse = Invoke-RestMethod -Uri "http://localhost:3001/admin/users/pending" -Method Get -Headers $adminHeaders -WebSession $adminSession
    Write-Host "✅ Неактивных пользователей: $($pendingUsersResponse.Length)" -ForegroundColor Green
} catch {
    Write-Host "❌ Ошибка получения неактивных пользователей: $($_.Exception.Message)" -ForegroundColor Red
}

if ($newUserId) {
    Write-Host "`n11. Сокрытие пользователя..." -ForegroundColor Yellow
    try {
        $hideResponse = Invoke-RestMethod -Uri "http://localhost:3001/admin/users/$newUserId/hide" -Method Post -Headers $adminHeaders -WebSession $adminSession
        Write-Host "✅ Пользователь скрыт" -ForegroundColor Green
    } catch {
        Write-Host "❌ Ошибка сокрытия пользователя: $($_.Exception.Message)" -ForegroundColor Red
    }
}

Write-Host "`n=== Тестирование административных функций завершено ===" -ForegroundColor Green
