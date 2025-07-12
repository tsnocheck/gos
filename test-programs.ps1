# PowerShell скрипт для тестирования API программ ДПП ПК
# Запуск: .\test-programs.ps1

$baseUrl = "http://localhost:3001"
$headers = @{
    "Content-Type" = "application/json"
}

Write-Host "=== Тестирование API программ ДПП ПК ===" -ForegroundColor Green

# 1. Логин администратора
Write-Host "`n1. Логин администратора..." -ForegroundColor Yellow
$loginData = @{
    email = "admin@goszalupa.ru"
    password = "admin123456"
} | ConvertTo-Json

try {
    $loginResponse = Invoke-RestMethod -Uri "$baseUrl/auth/login" -Method POST -Body $loginData -Headers $headers
    $adminToken = $loginResponse.access_token
    $adminHeaders = @{
        "Content-Type" = "application/json"
        "Authorization" = "Bearer $adminToken"
    }
    Write-Host "✓ Администратор вошел в систему" -ForegroundColor Green
    Write-Host "Admin Token: $($adminToken.Substring(0, 20))..." -ForegroundColor Cyan
} catch {
    Write-Host "✗ Ошибка входа администратора: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}

# 2. Создание тестового автора
Write-Host "`n2. Создание тестового автора..." -ForegroundColor Yellow
$authorData = @{
    email = "author@test.ru"
    lastName = "Иванов"
    firstName = "Иван"
    middleName = "Иванович"
    phone = "+7-900-123-4567"
    position = "Доцент"
    workplace = "МГУ"
    department = "Факультет математики"
    subjects = @("Математика", "Алгебра")
    academicDegree = "Кандидат наук"
    role = "author"
} | ConvertTo-Json

try {
    $authorResponse = Invoke-RestMethod -Uri "$baseUrl/admin/users" -Method POST -Body $authorData -Headers $adminHeaders
    Write-Host "✓ Автор создан: $($authorResponse.email)" -ForegroundColor Green
    
    # Одобряем автора
    $approveResponse = Invoke-RestMethod -Uri "$baseUrl/admin/users/$($authorResponse.id)/approve" -Method POST -Headers $adminHeaders
    Write-Host "✓ Автор одобрен" -ForegroundColor Green
} catch {
    Write-Host "✗ Ошибка создания автора: $($_.Exception.Message)" -ForegroundColor Red
}

# 3. Логин автора
Write-Host "`n3. Логин автора..." -ForegroundColor Yellow
$authorLoginData = @{
    email = "author@test.ru"
    password = "defaultpassword"
} | ConvertTo-Json

try {
    $authorLoginResponse = Invoke-RestMethod -Uri "$baseUrl/auth/login" -Method POST -Body $authorLoginData -Headers $headers
    $authorToken = $authorLoginResponse.access_token
    $authorHeaders = @{
        "Content-Type" = "application/json"
        "Authorization" = "Bearer $authorToken"
    }
    Write-Host "✓ Автор вошел в систему" -ForegroundColor Green
} catch {
    Write-Host "✗ Ошибка входа автора: $($_.Exception.Message)" -ForegroundColor Red
}

# 4. Создание программы автором
Write-Host "`n4. Создание программы автором..." -ForegroundColor Yellow
$programData = @{
    title = "Основы цифровой трансформации образования"
    description = "Программа повышения квалификации для преподавателей в области цифровых технологий"
    programCode = "ДПП-ПК-001"
    duration = 72
    targetAudience = "Преподаватели высших учебных заведений"
    competencies = "ПК-1, ПК-2, ПК-3"
    learningOutcomes = "Умение использовать цифровые технологии в образовательном процессе"
    content = "Модуль 1: Введение в цифровизацию. Модуль 2: Онлайн-платформы. Модуль 3: Практика."
    methodology = "Лекции, семинары, практические занятия, проектная работа"
    assessment = "Зачет по результатам выполнения проектной работы"
    materials = "Учебно-методические материалы, видеолекции, презентации"
    requirements = "Высшее образование, опыт преподавательской деятельности"
    nprContent = "Федеральный закон об образовании, профессиональные стандарты"
    pmrContent = "Теоретические основы цифровизации образования"
    vrContent = "Специализация по отраслям знаний"
} | ConvertTo-Json

try {
    $programResponse = Invoke-RestMethod -Uri "$baseUrl/programs" -Method POST -Body $programData -Headers $authorHeaders
    $programId = $programResponse.id
    Write-Host "✓ Программа создана: $($programResponse.title)" -ForegroundColor Green
    Write-Host "Program ID: $programId" -ForegroundColor Cyan
} catch {
    Write-Host "✗ Ошибка создания программы: $($_.Exception.Message)" -ForegroundColor Red
}

# 5. Получение программ автора
Write-Host "`n5. Получение программ автора..." -ForegroundColor Yellow
try {
    $authorPrograms = Invoke-RestMethod -Uri "$baseUrl/programs/my" -Method GET -Headers $authorHeaders
    Write-Host "✓ Получено программ автора: $($authorPrograms.total)" -ForegroundColor Green
} catch {
    Write-Host "✗ Ошибка получения программ: $($_.Exception.Message)" -ForegroundColor Red
}

# 6. Редактирование программы
Write-Host "`n6. Редактирование программы..." -ForegroundColor Yellow
$updateData = @{
    description = "Обновленное описание программы повышения квалификации"
    duration = 96
} | ConvertTo-Json

try {
    $updateResponse = Invoke-RestMethod -Uri "$baseUrl/programs/$programId" -Method PATCH -Body $updateData -Headers $authorHeaders
    Write-Host "✓ Программа обновлена" -ForegroundColor Green
} catch {
    Write-Host "✗ Ошибка обновления программы: $($_.Exception.Message)" -ForegroundColor Red
}

# 7. Отправка программы на экспертизу
Write-Host "`n7. Отправка программы на экспертизу..." -ForegroundColor Yellow
$submitData = @{
    message = "Программа готова к экспертизе"
} | ConvertTo-Json

try {
    $submitResponse = Invoke-RestMethod -Uri "$baseUrl/programs/$programId/submit" -Method POST -Body $submitData -Headers $authorHeaders
    Write-Host "✓ Программа отправлена на экспертизу" -ForegroundColor Green
} catch {
    Write-Host "✗ Ошибка отправки программы: $($_.Exception.Message)" -ForegroundColor Red
}

# 8. Создание эксперта администратором
Write-Host "`n8. Создание эксперта..." -ForegroundColor Yellow
$expertData = @{
    email = "expert@test.ru"
    lastName = "Петров"
    firstName = "Петр"
    middleName = "Петрович"
    phone = "+7-900-123-4568"
    position = "Профессор"
    workplace = "СПбГУ"
    department = "Факультет информатики"
    subjects = @("Информатика", "Программирование")
    academicDegree = "Доктор наук"
    role = "expert"
} | ConvertTo-Json

try {
    $expertResponse = Invoke-RestMethod -Uri "$baseUrl/admin/users" -Method POST -Body $expertData -Headers $adminHeaders
    $expertId = $expertResponse.id
    Write-Host "✓ Эксперт создан: $($expertResponse.email)" -ForegroundColor Green
    
    # Одобряем эксперта
    Invoke-RestMethod -Uri "$baseUrl/admin/users/$expertId/approve" -Method POST -Headers $adminHeaders
    Write-Host "✓ Эксперт одобрен" -ForegroundColor Green
} catch {
    Write-Host "✗ Ошибка создания эксперта: $($_.Exception.Message)" -ForegroundColor Red
}

# 9. Назначение экспертизы
Write-Host "`n9. Назначение экспертизы..." -ForegroundColor Yellow
$assignData = @{
    expertId = $expertId
    assignmentMessage = "Прошу провести экспертизу данной программы"
} | ConvertTo-Json

try {
    $expertiseResponse = Invoke-RestMethod -Uri "$baseUrl/expertise/programs/$programId/assign" -Method POST -Body $assignData -Headers $adminHeaders
    $expertiseId = $expertiseResponse.id
    Write-Host "✓ Экспертиза назначена" -ForegroundColor Green
    Write-Host "Expertise ID: $expertiseId" -ForegroundColor Cyan
} catch {
    Write-Host "✗ Ошибка назначения экспертизы: $($_.Exception.Message)" -ForegroundColor Red
}

# 10. Логин эксперта
Write-Host "`n10. Логин эксперта..." -ForegroundColor Yellow
$expertLoginData = @{
    email = "expert@test.ru"
    password = "defaultpassword"
} | ConvertTo-Json

try {
    $expertLoginResponse = Invoke-RestMethod -Uri "$baseUrl/auth/login" -Method POST -Body $expertLoginData -Headers $headers
    $expertToken = $expertLoginResponse.access_token
    $expertHeaders = @{
        "Content-Type" = "application/json"
        "Authorization" = "Bearer $expertToken"
    }
    Write-Host "✓ Эксперт вошел в систему" -ForegroundColor Green
} catch {
    Write-Host "✗ Ошибка входа эксперта: $($_.Exception.Message)" -ForegroundColor Red
}

# 11. Получение экспертиз эксперта
Write-Host "`n11. Получение экспертиз эксперта..." -ForegroundColor Yellow
try {
    $expertExpertises = Invoke-RestMethod -Uri "$baseUrl/expertise/my" -Method GET -Headers $expertHeaders
    Write-Host "✓ Получено экспертиз: $($expertExpertises.total)" -ForegroundColor Green
} catch {
    Write-Host "✗ Ошибка получения экспертиз: $($_.Exception.Message)" -ForegroundColor Red
}

# 12. Обновление экспертизы экспертом
Write-Host "`n12. Обновление экспертизы экспертом..." -ForegroundColor Yellow
$expertiseUpdateData = @{
    generalFeedback = "Программа имеет хорошую структуру и актуальное содержание"
    relevanceScore = 8
    contentQualityScore = 9
    methodologyScore = 7
    practicalValueScore = 8
    innovationScore = 6
    expertComments = "Рекомендуется доработать практическую часть"
} | ConvertTo-Json

try {
    $expertiseUpdateResponse = Invoke-RestMethod -Uri "$baseUrl/expertise/$expertiseId" -Method PATCH -Body $expertiseUpdateData -Headers $expertHeaders
    Write-Host "✓ Экспертиза обновлена" -ForegroundColor Green
} catch {
    Write-Host "✗ Ошибка обновления экспертизы: $($_.Exception.Message)" -ForegroundColor Red
}

# 13. Завершение экспертизы
Write-Host "`n13. Завершение экспертизы..." -ForegroundColor Yellow
$completeData = @{
    generalFeedback = "Программа соответствует требованиям и может быть рекомендована к утверждению"
    conclusion = "Рекомендую программу к утверждению с учетом незначительных доработок"
    relevanceScore = 8
    contentQualityScore = 9
    methodologyScore = 7
    practicalValueScore = 8
    innovationScore = 6
    isRecommendedForApproval = $true
    recommendations = "Добавить больше практических заданий"
    expertComments = "Качественная программа с актуальным содержанием"
} | ConvertTo-Json

try {
    $completeResponse = Invoke-RestMethod -Uri "$baseUrl/expertise/$expertiseId/complete" -Method POST -Body $completeData -Headers $expertHeaders
    Write-Host "✓ Экспертиза завершена" -ForegroundColor Green
    Write-Host "Общая оценка: $($completeResponse.totalScore)" -ForegroundColor Cyan
} catch {
    Write-Host "✗ Ошибка завершения экспертизы: $($_.Exception.Message)" -ForegroundColor Red
}

# 14. Создание рекомендации экспертом
Write-Host "`n14. Создание рекомендации..." -ForegroundColor Yellow
$recommendationData = @{
    programId = $programId
    title = "Доработка практической части"
    content = "Рекомендуется добавить больше практических заданий для закрепления материала"
    type = "content"
    priority = 2
    assignedToId = $authorResponse.id
} | ConvertTo-Json

try {
    $recommendationResponse = Invoke-RestMethod -Uri "$baseUrl/recommendations" -Method POST -Body $recommendationData -Headers $expertHeaders
    $recommendationId = $recommendationResponse.id
    Write-Host "✓ Рекомендация создана" -ForegroundColor Green
    Write-Host "Recommendation ID: $recommendationId" -ForegroundColor Cyan
} catch {
    Write-Host "✗ Ошибка создания рекомендации: $($_.Exception.Message)" -ForegroundColor Red
}

# 15. Ответ автора на рекомендацию
Write-Host "`n15. Ответ автора на рекомендацию..." -ForegroundColor Yellow
$responseData = @{
    authorResponse = "Принято к сведению. Практическая часть будет доработана в следующей версии программы."
    status = "resolved"
} | ConvertTo-Json

try {
    $responseResponse = Invoke-RestMethod -Uri "$baseUrl/recommendations/$recommendationId/respond" -Method POST -Body $responseData -Headers $authorHeaders
    Write-Host "✓ Автор ответил на рекомендацию" -ForegroundColor Green
} catch {
    Write-Host "✗ Ошибка ответа на рекомендацию: $($_.Exception.Message)" -ForegroundColor Red
}

# 16. Одобрение программы администратором
Write-Host "`n16. Одобрение программы администратором..." -ForegroundColor Yellow
$approveData = @{
    comment = "Программа одобрена на основании положительной экспертизы"
} | ConvertTo-Json

try {
    $approveResponse = Invoke-RestMethod -Uri "$baseUrl/programs/$programId/approve" -Method POST -Body $approveData -Headers $adminHeaders
    Write-Host "✓ Программа одобрена администратором" -ForegroundColor Green
} catch {
    Write-Host "✗ Ошибка одобрения программы: $($_.Exception.Message)" -ForegroundColor Red
}

# 17. Создание новой версии программы
Write-Host "`n17. Создание новой версии программы..." -ForegroundColor Yellow
$versionData = @{
    title = "Основы цифровой трансформации образования v2.0"
    description = "Обновленная версия программы с доработанной практической частью"
    changeDescription = "Добавлены практические задания и кейсы"
} | ConvertTo-Json

try {
    $versionResponse = Invoke-RestMethod -Uri "$baseUrl/programs/$programId/version" -Method POST -Body $versionData -Headers $authorHeaders
    Write-Host "✓ Новая версия программы создана" -ForegroundColor Green
    Write-Host "Version: $($versionResponse.version)" -ForegroundColor Cyan
} catch {
    Write-Host "✗ Ошибка создания версии: $($_.Exception.Message)" -ForegroundColor Red
}

# 18. Получение статистики
Write-Host "`n18. Получение статистики..." -ForegroundColor Yellow
try {
    $programStats = Invoke-RestMethod -Uri "$baseUrl/programs/statistics" -Method GET -Headers $adminHeaders
    Write-Host "✓ Статистика программ получена" -ForegroundColor Green
    Write-Host "Всего программ: $($programStats.total)" -ForegroundColor Cyan
    
    $expertiseStats = Invoke-RestMethod -Uri "$baseUrl/expertise/statistics" -Method GET -Headers $adminHeaders
    Write-Host "✓ Статистика экспертиз получена" -ForegroundColor Green
    Write-Host "Всего экспертиз: $($expertiseStats.total)" -ForegroundColor Cyan
    
    $recommendationStats = Invoke-RestMethod -Uri "$baseUrl/recommendations/statistics" -Method GET -Headers $adminHeaders
    Write-Host "✓ Статистика рекомендаций получена" -ForegroundColor Green
    Write-Host "Всего рекомендаций: $($recommendationStats.total)" -ForegroundColor Cyan
} catch {
    Write-Host "✗ Ошибка получения статистики: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host "`n=== Тестирование завершено ===" -ForegroundColor Green
Write-Host "Все основные функции подсистемы программ ДПП ПК протестированы!" -ForegroundColor Cyan
