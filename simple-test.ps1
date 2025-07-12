# Simple API test
Write-Host "=== Testing API ===" -ForegroundColor Green

# Test 1: Health check
Write-Host "1. Health check..." -ForegroundColor Yellow
try {
    $response = Invoke-RestMethod -Uri "http://localhost:3001/" -Method Get
    Write-Host "Server OK: $response" -ForegroundColor Green
} catch {
    Write-Host "Server error: $($_.Exception.Message)" -ForegroundColor Red
}

# Test 2: Admin login
Write-Host "`n2. Admin login..." -ForegroundColor Yellow
$adminLoginBody = @{
    email = "admin@goszalupa.ru"
    password = "admin123456"
} | ConvertTo-Json

try {
    $adminResponse = Invoke-RestMethod -Uri "http://localhost:3001/auth/login" -Method Post -Body $adminLoginBody -ContentType "application/json"
    Write-Host "Admin login successful!" -ForegroundColor Green
    $adminToken = $adminResponse.accessToken
    Write-Host "Token: $adminToken" -ForegroundColor Cyan
} catch {
    Write-Host "Admin login error: $($_.Exception.Message)" -ForegroundColor Red
}

# Test 3: Register new user
Write-Host "`n3. Register new user..." -ForegroundColor Yellow
$registerBody = @{
    email = "testuser@example.com"
    password = "password123"
    firstName = "Test"
    lastName = "User"
} | ConvertTo-Json

try {
    $registerResponse = Invoke-RestMethod -Uri "http://localhost:3001/auth/register" -Method Post -Body $registerBody -ContentType "application/json"
    Write-Host "Registration successful!" -ForegroundColor Green
    $userId = $registerResponse.user.id
    Write-Host "User ID: $userId" -ForegroundColor Cyan
} catch {
    Write-Host "Registration error: $($_.Exception.Message)" -ForegroundColor Red
}

# Test 4: Admin - Get all users
if ($adminToken) {
    Write-Host "`n4. Admin - Get all users..." -ForegroundColor Yellow
    $adminHeaders = @{
        "Authorization" = "Bearer $adminToken"
    }
    
    try {
        $usersResponse = Invoke-RestMethod -Uri "http://localhost:3001/admin/users" -Method Get -Headers $adminHeaders
        Write-Host "Users count: $($usersResponse.Length)" -ForegroundColor Green
        $usersResponse | ForEach-Object { 
            Write-Host "- $($_.email) ($($_.role), $($_.status))" -ForegroundColor White
        }
    } catch {
        Write-Host "Get users error: $($_.Exception.Message)" -ForegroundColor Red
    }
}

Write-Host "`n=== Test completed ===" -ForegroundColor Green
