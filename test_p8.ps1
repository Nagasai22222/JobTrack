$BASE = "http://localhost:8080"
$PASS = 0; $FAIL = 0
$UID = Get-Random -Minimum 1000 -Maximum 9999

function Chk($label, $ok, $info="") {
    if ($ok) { Write-Host "  [PASS] $label" -ForegroundColor Green; $script:PASS++ }
    else      { Write-Host "  [FAIL] $label $info" -ForegroundColor Red; $script:FAIL++ }
}

function DoPost($path, $bodyObj, $token) {
    $h = @{ "Content-Type" = "application/json" }
    if ($token) { $h["Authorization"] = "Bearer $token" }
    try {
        $bodyJson = if ($bodyObj -is [string]) { $bodyObj } else { $bodyObj | ConvertTo-Json -Compress }
        $rsp = Invoke-RestMethod -Method POST -Uri "$BASE$path" -Headers $h -Body $bodyJson -ErrorAction Stop
        return @{ ok=$true; code=200; body=$rsp }
    } catch {
        $code = 0
        if ($_.Exception.Response) { $code = [int]$_.Exception.Response.StatusCode }
        $b = $null
        if ($_.Exception.Response) {
            try {
                $sr = [System.IO.StreamReader]::new($_.Exception.Response.GetResponseStream())
                $raw = $sr.ReadToEnd()
                $b = $raw | ConvertFrom-Json
            } catch { $b = $raw }
        }
        return @{ ok=$false; code=$code; body=$b }
    }
}

function DoGet($path, $token) {
    $h = @{}
    if ($token) { $h["Authorization"] = "Bearer $token" }
    try {
        $rsp = Invoke-RestMethod -Method GET -Uri "$BASE$path" -Headers $h -ErrorAction Stop
        return @{ ok=$true; code=200; body=$rsp }
    } catch {
        $code = 0
        if ($_.Exception.Response) { $code = [int]$_.Exception.Response.StatusCode }
        $b = $null
        if ($_.Exception.Response) {
            try {
                $sr = [System.IO.StreamReader]::new($_.Exception.Response.GetResponseStream())
                $raw = $sr.ReadToEnd()
                $b = $raw | ConvertFrom-Json
            } catch { $b = $raw }
        }
        return @{ ok=$false; code=$code; body=$b }
    }
}

function DoOptions($path, $origin="http://localhost:3000") {
    $req = [System.Net.HttpWebRequest]::Create("$BASE$path")
    $req.Method = "OPTIONS"
    $req.Headers.Add("Origin", $origin)
    $req.Headers.Add("Access-Control-Request-Method", "GET")
    $req.Headers.Add("Access-Control-Request-Headers", "Authorization, Content-Type")
    try {
        $resp = $req.GetResponse()
        $code = [int]$resp.StatusCode
        $allowOrigin = $resp.Headers["Access-Control-Allow-Origin"]
        $allowMethods = $resp.Headers["Access-Control-Allow-Methods"]
        $resp.Close()
        return @{ ok=$true; code=$code; origin=$allowOrigin; methods=$allowMethods }
    } catch [System.Net.WebException] {
        $code = 0
        if ($_.Exception.Response) { $code = [int]$_.Exception.Response.StatusCode }
        return @{ ok=$false; code=$code }
    }
}

Write-Host "`n=== SETUP ===" -ForegroundColor Cyan

$u1Name = "p8u1_$UID"
$u2Name = "p8u2_$UID"

DoPost "/api/auth/register" @{ username=$u1Name; email="$u1Name@test.com"; password="password123" } $null | Out-Null
DoPost "/api/auth/register" @{ username=$u2Name; email="$u2Name@test.com"; password="password123" } $null | Out-Null

$r1 = DoPost "/api/auth/login" @{ username=$u1Name; password="password123" } $null
Chk "User1 login" ($r1.ok -and $r1.body.token)
$T1 = $r1.body.token

$r2 = DoPost "/api/auth/login" @{ username=$u2Name; password="password123" } $null
Chk "User2 login" ($r2.ok -and $r2.body.token)
$T2 = $r2.body.token

$ra = DoPost "/api/auth/login" @{ username="admin"; password="admin_password" } $null
Chk "Admin login" ($ra.ok -and $ra.body.token)
$TA = $ra.body.token

# Create application for User 1
$app1Res = DoPost "/api/applications" @{ companyName="Stark Industries"; jobRole="AI Engineer"; status="APPLIED"; appliedDate="2026-05-01" } $T1
$APP1_ID = $app1Res.body.id
Chk "User1 creates application (ID=$APP1_ID)" ($APP1_ID -ne $null)

# ---- PHASE 8 TEST CASES ----
Write-Host "`n=== PHASE 8 TESTS ===" -ForegroundColor Cyan

# 1. Application starts successfully
Chk "1. Application starts successfully" ($APP1_ID -ne $null)

# 2. Health endpoint returns 200 with status UP
$health = DoGet "/actuator/health" $null
Chk "2. Health endpoint returns 200 UP" ($health.ok -and $health.body.status -eq "UP") "got $($health.body)"

# 3. Swagger/OpenAPI endpoint returns 200
$swagger = DoGet "/v3/api-docs" $null
Chk "3. Swagger/OpenAPI endpoint reachable" ($swagger.ok -and $swagger.body.openapi -ne $null) "got $($swagger.code)"

# 4. Protected endpoint without JWT returns 401
$noJwt = DoGet "/api/applications" $null
Chk "4. Protected endpoint without JWT -> 401" ($noJwt.code -eq 401) "got $($noJwt.code)"

# 5. Invalid JWT returns 401
$badJwt = DoGet "/api/applications" "invalid.jwt.token.string"
Chk "5. Invalid JWT -> 401" ($badJwt.code -eq 401) "got $($badJwt.code)"

# 6. Valid JWT works
$validJwt = DoGet "/api/applications" $T1
Chk "6. Valid JWT works -> 200" ($validJwt.ok) "got $($validJwt.code)"

# 7. Validation errors return standardized JSON (timestamp, status, error, message, path)
$valErr = DoPost "/api/applications" @{ companyName=""; jobRole="" } $T1
Chk "7a. Validation error -> 400" ($valErr.code -eq 400) "got $($valErr.code)"
Chk "7b. Has timestamp" ($valErr.body.timestamp -ne $null) "got $($valErr.body.timestamp)"
Chk "7c. Has status 400" ($valErr.body.status -eq 400) "got $($valErr.body.status)"
Chk "7d. Has error Bad Request" ($valErr.body.error -eq "Bad Request") "got $($valErr.body.error)"
Chk "7e. Has message" ($valErr.body.message -ne $null) "got $($valErr.body.message)"
Chk "7f. Has path" ($valErr.body.path -eq "/api/applications") "got $($valErr.body.path)"

# 8. Missing resource returns 404
$missingRes = DoGet "/api/applications/999999" $T1
Chk "8. Missing resource -> 404" ($missingRes.code -eq 404) "got $($missingRes.code)"

# 9. Ownership isolation works
$ownRes = DoGet "/api/applications/$APP1_ID" $T2
Chk "9. Ownership isolation -> 403" ($ownRes.code -eq 403) "got $($ownRes.code)"

# 10. Admin authorization works
$adminRes = DoGet "/api/applications/$APP1_ID" $TA
Chk "10. Admin can access user app -> 200" ($adminRes.ok) "got $($adminRes.code)"

# 11. Pagination limit > 100 rejected (400)
$bigPage = DoGet "/api/applications?size=101" $T1
Chk "11. Pagination size > 100 -> 400" ($bigPage.code -eq 400) "got $($bigPage.code)"

# 12. Invalid sort field rejected (400)
$badSort = DoGet "/api/applications?sortBy=maliciousField" $T1
Chk "12. Invalid sort field -> 400" ($badSort.code -eq 400) "got $($badSort.code)"

# 13. CORS preflight OPTIONS request returns allowed headers
$corsRes = DoOptions "/api/applications" "http://localhost:3000"
Chk "13a. CORS OPTIONS -> 200" ($corsRes.ok -or $corsRes.code -eq 200) "got $($corsRes.code)"
Chk "13b. CORS Allow-Origin matches" ($corsRes.origin -eq "http://localhost:3000") "got $($corsRes.origin)"

# 14. No sensitive data appears in normal error responses
$hasSensitive = ($valErr.body | ConvertTo-Json) -like "*Exception*" -or ($valErr.body | ConvertTo-Json) -like "*password*"
Chk "14. No sensitive data / stack trace in error response" (-not $hasSensitive)

# 15. Existing document security remains intact
$docSecRes = DoGet "/api/applications/$APP1_ID/documents/1/download" $T2
Chk "15. User2 cannot download User1 document -> 403" ($docSecRes.code -eq 403) "got $($docSecRes.code)"

# ---- SUMMARY ----
Write-Host "`n============================================================" -ForegroundColor Cyan
Write-Host "PHASE 8 TEST RESULTS" -ForegroundColor Cyan
Write-Host "  Passed : $PASS" -ForegroundColor Green
Write-Host "  Failed : $FAIL" -ForegroundColor $(if ($FAIL -eq 0) {"Green"} else {"Red"})
Write-Host "============================================================" -ForegroundColor Cyan
