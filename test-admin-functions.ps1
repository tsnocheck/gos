# Test administrative functions
Write-Host "=== Testing Admin Functions ===" -ForegroundColor Green

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

# Test 1: Get pending users
Write-Host "`n1. Get pending users..." -ForegroundColor Yellow
try {
    $pendingUsers = Invoke-RestMethod -Uri "http://localhost:3001/admin/users/pending" -Method Get -Headers $adminHeaders
    Write-Host "Pending users count: $($pendingUsers.Length)" -ForegroundColor Green
    $pendingUsers | ForEach-Object { 
        Write-Host "- $($_.email) (ID: $($_.id))" -ForegroundColor White
        $global:testUserId = $_.id  # Save for other tests
    }
} catch {
    Write-Host "Error: $($_.Exception.Message)" -ForegroundColor Red
}

# Test 2: Approve user
if ($global:testUserId) {
    Write-Host "`n2. Approve user..." -ForegroundColor Yellow
    try {
        $approveResponse = Invoke-RestMethod -Uri "http://localhost:3001/admin/users/$global:testUserId/approve" -Method Post -Headers $adminHeaders
        Write-Host "User approved successfully!" -ForegroundColor Green
        Write-Host "Status: $($approveResponse.status)" -ForegroundColor Cyan
    } catch {
        Write-Host "Error: $($_.Exception.Message)" -ForegroundColor Red
    }
}

# Test 3: Change user role
if ($global:testUserId) {
    Write-Host "`n3. Change user role to expert..." -ForegroundColor Yellow
    $changeRoleBody = @{
        userId = $global:testUserId
        role = "expert"
    } | ConvertTo-Json
    
    try {
        $roleResponse = Invoke-RestMethod -Uri "http://localhost:3001/admin/users/role" -Method Patch -Body $changeRoleBody -ContentType "application/json" -Headers $adminHeaders
        Write-Host "Role changed successfully!" -ForegroundColor Green
        Write-Host "New role: $($roleResponse.role)" -ForegroundColor Cyan
    } catch {
        Write-Host "Error: $($_.Exception.Message)" -ForegroundColor Red
    }
}

# Test 4: Create admin user
Write-Host "`n4. Create new admin user..." -ForegroundColor Yellow
$createAdminBody = @{
    email = "admin2@goszalupa.ru"
    password = "admin123456"
    firstName = "Admin"
    lastName = "Second"
    role = "admin"
    status = "active"
} | ConvertTo-Json

try {
    $createResponse = Invoke-RestMethod -Uri "http://localhost:3001/admin/users" -Method Post -Body $createAdminBody -ContentType "application/json" -Headers $adminHeaders
    Write-Host "Admin user created successfully!" -ForegroundColor Green
    Write-Host "New admin ID: $($createResponse.id)" -ForegroundColor Cyan
} catch {
    Write-Host "Error: $($_.Exception.Message)" -ForegroundColor Red
}

# Test 5: Get all users by role
Write-Host "`n5. Get all admin users..." -ForegroundColor Yellow
try {
    $adminUsers = Invoke-RestMethod -Uri "http://localhost:3001/admin/users/role/admin" -Method Get -Headers $adminHeaders
    Write-Host "Admin users count: $($adminUsers.Length)" -ForegroundColor Green
    $adminUsers | ForEach-Object { 
        Write-Host "- $($_.email) ($($_.status))" -ForegroundColor White
    }
} catch {
    Write-Host "Error: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host "`n=== Admin test completed ===" -ForegroundColor Green
