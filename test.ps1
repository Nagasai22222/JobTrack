$ErrorActionPreference = "Stop"
$baseUrl = "http://localhost:8080/api"

Write-Host "--- Starting tests ---"

# 1. Register User 1
$req1 = @{ username="user1"; email="user1@example.com"; password="password123" } | ConvertTo-Json
Write-Host "Register user1..."
$res1 = Invoke-RestMethod -Uri "$baseUrl/auth/register" -Method Post -Body $req1 -ContentType "application/json"
$token1 = $res1.token
Write-Host "User 1 Token: $token1"

# 2. Register Duplicate User 1
Write-Host "Register duplicate user1..."
try {
    Invoke-RestMethod -Uri "$baseUrl/auth/register" -Method Post -Body $req1 -ContentType "application/json"
    Write-Host "FAIL: Duplicate successfully registered"
} catch {
    Write-Host "PASS: Duplicate rejected with status $($_.Exception.Response.StatusCode.value__)"
}

# 3. Register User 2
$req2 = @{ username="user2"; email="user2@example.com"; password="password123" } | ConvertTo-Json
$res2 = Invoke-RestMethod -Uri "$baseUrl/auth/register" -Method Post -Body $req2 -ContentType "application/json"
$token2 = $res2.token

# 4. Login User 1
Write-Host "Login user1..."
$login = @{ username="user1"; password="password123" } | ConvertTo-Json
$loginRes = Invoke-RestMethod -Uri "$baseUrl/auth/login" -Method Post -Body $login -ContentType "application/json"
Write-Host "Login token: $($loginRes.token)"

# 5. Bad password login
Write-Host "Bad login..."
try {
    $badLogin = @{ username="user1"; password="wrongpassword" } | ConvertTo-Json
    Invoke-RestMethod -Uri "$baseUrl/auth/login" -Method Post -Body $badLogin -ContentType "application/json"
} catch {
    Write-Host "PASS: Bad login rejected with status $($_.Exception.Response.StatusCode.value__)"
}

# 6. Create Application User 1
Write-Host "Create Application with User 1..."
$appReq = @{ companyName="DeltaX"; jobRole="Engineer"; status="APPLIED" } | ConvertTo-Json
$appRes = Invoke-RestMethod -Uri "$baseUrl/applications" -Method Post -Body $appReq -ContentType "application/json" -Headers @{ Authorization="Bearer $token1" }
Write-Host ("Created app with ID: " + $appRes.id)
$appId = $appRes.id

# 7. Get Applications No Token
Write-Host "Get Applications without Token..."
try {
    Invoke-RestMethod -Uri "$baseUrl/applications" -Method Get
} catch {
    Write-Host "PASS: Unauthorized rejected with status $($_.Exception.Response.StatusCode.value__)"
}

# 8. User 2 getting User 1's application
Write-Host "User 2 getting User 1's Application..."
try {
    Invoke-RestMethod -Uri "$baseUrl/applications/$appId" -Method Get -Headers @{ Authorization="Bearer $token2" }
} catch {
    Write-Host "PASS: User 2 getting User 1 app rejected with status $($_.Exception.Response.StatusCode.value__)"
}

# 9. Admin fetching applications
Write-Host "Admin authenticating..."
$adminLogin = @{ username="admin"; password="admin_password" } | ConvertTo-Json
$adminRes = Invoke-RestMethod -Uri "$baseUrl/auth/login" -Method Post -Body $adminLogin -ContentType "application/json"
$adminToken = $adminRes.token

Write-Host "Admin accessing all apps..."
$allApps = Invoke-RestMethod -Uri "$baseUrl/applications" -Method Get -Headers @{ Authorization="Bearer $adminToken" }
Write-Host "Admin apps count: $($allApps.Length)"

Write-Host "All tests completed!"
