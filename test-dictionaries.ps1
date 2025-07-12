# Test Dictionary Management System
Write-Host "=== Testing Dictionary Management ===" -ForegroundColor Green

# Login as admin
$adminLoginBody = @{
    email = "admin@goszalupa.ru"
    password = "admin123456"
} | ConvertTo-Json

$adminResponse = Invoke-RestMethod -Uri "http://localhost:3001/auth/login" -Method Post -Body $adminLoginBody -ContentType "application/json"
$adminToken = $adminResponse.accessToken
$adminHeaders = @{
    "Authorization" = "Bearer $adminToken"
}

Write-Host "Admin logged in successfully!" -ForegroundColor Green

# Test 1: Initialize base dictionaries
Write-Host "`n1. Initialize base dictionaries..." -ForegroundColor Yellow
try {
    $initResponse = Invoke-RestMethod -Uri "http://localhost:3001/dictionaries/initialize" -Method Post -Headers $adminHeaders
    Write-Host "Dictionaries initialized: $($initResponse.message)" -ForegroundColor Green
} catch {
    Write-Host "Error: $($_.Exception.Message)" -ForegroundColor Red
}

# Test 2: Get all dictionary types
Write-Host "`n2. Get dictionary types..." -ForegroundColor Yellow
try {
    $typesResponse = Invoke-RestMethod -Uri "http://localhost:3001/dictionaries/types" -Method Get -Headers $adminHeaders
    Write-Host "Dictionary types:" -ForegroundColor Green
    $typesResponse | ForEach-Object { 
        Write-Host "- $($_.type): $($_.count) items" -ForegroundColor White
    }
} catch {
    Write-Host "Error: $($_.Exception.Message)" -ForegroundColor Red
}

# Test 3: Get subjects dictionary
Write-Host "`n3. Get subjects dictionary..." -ForegroundColor Yellow
try {
    $subjectsResponse = Invoke-RestMethod -Uri "http://localhost:3001/dictionaries/type/subject" -Method Get -Headers $adminHeaders
    Write-Host "Subjects count: $($subjectsResponse.Length)" -ForegroundColor Green
    $subjectsResponse | Select-Object -First 5 | ForEach-Object { 
        Write-Host "- $($_.value)" -ForegroundColor White
    }
} catch {
    Write-Host "Error: $($_.Exception.Message)" -ForegroundColor Red
}

# Test 4: Add new subject
Write-Host "`n4. Add new subject..." -ForegroundColor Yellow
$newSubjectBody = @{
    type = "subject"
    value = "Искусственный интеллект"
    description = "Новый предмет по ИИ"
    sortOrder = 10
} | ConvertTo-Json

try {
    $addResponse = Invoke-RestMethod -Uri "http://localhost:3001/dictionaries" -Method Post -Body $newSubjectBody -ContentType "application/json" -Headers $adminHeaders
    Write-Host "New subject added: $($addResponse.value)" -ForegroundColor Green
    $newSubjectId = $addResponse.id
} catch {
    Write-Host "Error: $($_.Exception.Message)" -ForegroundColor Red
}

# Test 5: Get all dictionaries (admin only)
Write-Host "`n5. Get all dictionaries..." -ForegroundColor Yellow
try {
    $allDictionaries = Invoke-RestMethod -Uri "http://localhost:3001/dictionaries/all" -Method Get -Headers $adminHeaders
    Write-Host "Total dictionary entries: $($allDictionaries.Length)" -ForegroundColor Green
    
    # Group by type
    $grouped = $allDictionaries | Group-Object type
    $grouped | ForEach-Object {
        Write-Host "- $($_.Name): $($_.Count) items" -ForegroundColor White
    }
} catch {
    Write-Host "Error: $($_.Exception.Message)" -ForegroundColor Red
}

# Test 6: Update the new subject
if ($newSubjectId) {
    Write-Host "`n6. Update subject..." -ForegroundColor Yellow
    $updateBody = @{
        description = "Обновленное описание предмета"
        sortOrder = 1
    } | ConvertTo-Json
    
    try {
        $updateResponse = Invoke-RestMethod -Uri "http://localhost:3001/dictionaries/$newSubjectId" -Method Patch -Body $updateBody -ContentType "application/json" -Headers $adminHeaders
        Write-Host "Subject updated: $($updateResponse.value)" -ForegroundColor Green
    } catch {
        Write-Host "Error: $($_.Exception.Message)" -ForegroundColor Red
    }
}

Write-Host "`n=== Dictionary test completed ===" -ForegroundColor Green
