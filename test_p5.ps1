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
        $code = [int]$_.Exception.Response.StatusCode.value__
        try { $b = $_.ErrorDetails.Message | ConvertFrom-Json } catch { $b = $_.ErrorDetails.Message }
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
        $code = [int]$_.Exception.Response.StatusCode.value__
        try { $b = $_.ErrorDetails.Message | ConvertFrom-Json } catch { $b = $_.ErrorDetails.Message }
        return @{ ok=$false; code=$code; body=$b }
    }
}

function DoPut($path, $bodyObj, $token) {
    $h = @{ "Content-Type" = "application/json" }
    if ($token) { $h["Authorization"] = "Bearer $token" }
    try {
        $bodyJson = if ($bodyObj -is [string]) { $bodyObj } else { $bodyObj | ConvertTo-Json -Compress }
        $rsp = Invoke-RestMethod -Method PUT -Uri "$BASE$path" -Headers $h -Body $bodyJson -ErrorAction Stop
        return @{ ok=$true; code=200; body=$rsp }
    } catch {
        $code = [int]$_.Exception.Response.StatusCode.value__
        try { $b = $_.ErrorDetails.Message | ConvertFrom-Json } catch { $b = $_.ErrorDetails.Message }
        return @{ ok=$false; code=$code; body=$b }
    }
}

function DoDel($path, $token) {
    $h = @{}
    if ($token) { $h["Authorization"] = "Bearer $token" }
    try {
        $rsp = Invoke-RestMethod -Method DELETE -Uri "$BASE$path" -Headers $h -ErrorAction Stop
        return @{ ok=$true; code=204 }
    } catch {
        $code = [int]$_.Exception.Response.StatusCode.value__
        return @{ ok=$false; code=$code }
    }
}

# ---- SETUP ----
Write-Host "`n=== SETUP ===" -ForegroundColor Cyan

$u1Name = "p5u1_$UID"
$u2Name = "p5u2_$UID"
$uEmpName = "p5empty_$UID"

DoPost "/api/auth/register" @{ username=$u1Name; email="$u1Name@test.com"; password="password123" } $null | Out-Null
DoPost "/api/auth/register" @{ username=$u2Name; email="$u2Name@test.com"; password="password123" } $null | Out-Null
DoPost "/api/auth/register" @{ username=$uEmpName; email="$uEmpName@test.com"; password="password123" } $null | Out-Null

$r1 = DoPost "/api/auth/login" @{ username=$u1Name; password="password123" } $null
Chk "User1 login" ($r1.ok -and $r1.body.token)
$T1 = $r1.body.token

$r2 = DoPost "/api/auth/login" @{ username=$u2Name; password="password123" } $null
Chk "User2 login" ($r2.ok -and $r2.body.token)
$T2 = $r2.body.token

$remp = DoPost "/api/auth/login" @{ username=$uEmpName; password="password123" } $null
Chk "Empty user login" ($remp.ok -and $remp.body.token)
$TEMPTY = $remp.body.token

$ra = DoPost "/api/auth/login" @{ username="admin"; password="admin_password" } $null
Chk "Admin login" ($ra.ok -and $ra.body.token)
$TA = $ra.body.token

# ---- 1. SECURITY & AUTHENTICATION ----
Write-Host "`n=== 1. Dashboard Security ===" -ForegroundColor Cyan

$t = DoGet "/api/dashboard/summary" $null
Chk "No JWT dashboard summary -> 401" ($t.code -eq 401) "got $($t.code)"

$t = DoGet "/api/dashboard/recent" $null
Chk "No JWT dashboard recent -> 401" ($t.code -eq 401) "got $($t.code)"

# ---- 2. EMPTY USER DASHBOARD ----
Write-Host "`n=== 2. Empty Account Dashboard ===" -ForegroundColor Cyan

$t = DoGet "/api/dashboard/summary" $TEMPTY
Chk "Empty user summary -> 200" ($t.ok)
Chk "Empty user totalApplications = 0" ($t.body.totalApplications -eq 0)
Chk "Empty user applied = 0" ($t.body.applied -eq 0)
Chk "Empty user screening = 0" ($t.body.screening -eq 0)
Chk "Empty user interview = 0" ($t.body.interview -eq 0)
Chk "Empty user offers = 0" ($t.body.offers -eq 0)
Chk "Empty user rejected = 0" ($t.body.rejected -eq 0)
Chk "Empty user withdrawn = 0" ($t.body.withdrawn -eq 0)

$t = DoGet "/api/dashboard/recent" $TEMPTY
Chk "Empty user recent -> empty list" ($t.ok -and $t.body.Count -eq 0)

# ---- 3. MULTIPLE STATUS COUNTS & OWNERSHIP ISOLATION ----
Write-Host "`n=== 3. Status Breakdown & Ownership ===" -ForegroundColor Cyan

$a1 = DoPost "/api/applications" @{ companyName="Comp1"; jobRole="Dev"; status="APPLIED"; appliedDate="2026-01-01" } $T1
$a2 = DoPost "/api/applications" @{ companyName="Comp2"; jobRole="Dev"; status="SCREENING"; appliedDate="2026-01-02" } $T1
$a3 = DoPost "/api/applications" @{ companyName="Comp3"; jobRole="Dev"; status="INTERVIEW"; appliedDate="2026-01-03" } $T1
$a4 = DoPost "/api/applications" @{ companyName="Comp4"; jobRole="Dev"; status="OFFER"; appliedDate="2026-01-04" } $T1
$a5 = DoPost "/api/applications" @{ companyName="Comp5"; jobRole="Dev"; status="REJECTED"; appliedDate="2026-01-05" } $T1
$a6 = DoPost "/api/applications" @{ companyName="Comp6"; jobRole="Dev"; status="WITHDRAWN"; appliedDate="2026-01-06" } $T1

$APP1_ID = $a1.body.id
$APP3_ID = $a3.body.id

$s1 = DoGet "/api/dashboard/summary" $T1
Chk "User1 dashboard summary -> 200" ($s1.ok)
Chk "User1 totalApplications = 6" ($s1.body.totalApplications -eq 6) "got $($s1.body.totalApplications)"
Chk "User1 applied = 1" ($s1.body.applied -eq 1)
Chk "User1 screening = 1" ($s1.body.screening -eq 1)
Chk "User1 interview = 1" ($s1.body.interview -eq 1)
Chk "User1 offers = 1" ($s1.body.offers -eq 1)
Chk "User1 rejected = 1" ($s1.body.rejected -eq 1)
Chk "User1 withdrawn = 1" ($s1.body.withdrawn -eq 1)

# User2 creates 2 applications
DoPost "/api/applications" @{ companyName="User2Comp1"; jobRole="Tester"; status="APPLIED"; appliedDate="2026-02-01" } $T2 | Out-Null
DoPost "/api/applications" @{ companyName="User2Comp2"; jobRole="Tester"; status="APPLIED"; appliedDate="2026-02-02" } $T2 | Out-Null

$s2 = DoGet "/api/dashboard/summary" $T2
Chk "User2 totalApplications = 2" ($s2.body.totalApplications -eq 2) "got $($s2.body.totalApplications)"
Chk "User2 applied = 2" ($s2.body.applied -eq 2)
Chk "User2 interview = 0" ($s2.body.interview -eq 0)

# Verify User1 counts were isolated from User2
$s1_check = DoGet "/api/dashboard/summary" $T1
Chk "User1 total remains 6 (isolated from User2)" ($s1_check.body.totalApplications -eq 6)

# ---- 4. STATUS TRANSITION ----
Write-Host "`n=== 4. Status Transition ===" -ForegroundColor Cyan

# Change Comp1 (APPLIED) to INTERVIEW
$up = DoPut "/api/applications/$APP1_ID" @{ companyName="Comp1"; jobRole="Dev"; status="INTERVIEW"; appliedDate="2026-01-01" } $T1
Chk "Status transition -> 200" ($up.ok)

$s1_trans = DoGet "/api/dashboard/summary" $T1
Chk "Total applications remains 6" ($s1_trans.body.totalApplications -eq 6)
Chk "Applied count decreased to 0" ($s1_trans.body.applied -eq 0)
Chk "Interview count increased to 2" ($s1_trans.body.interview -eq 2)

# ---- 5. APPLICATION DELETION ----
Write-Host "`n=== 5. Application Deletion ===" -ForegroundColor Cyan

# Delete Comp3 (INTERVIEW)
$del = DoDel "/api/applications/$APP3_ID" $T1
Chk "Delete application -> 204" ($del.ok -or $del.code -eq 204)

$s1_del = DoGet "/api/dashboard/summary" $T1
Chk "Total applications decreased to 5" ($s1_del.body.totalApplications -eq 5) "got $($s1_del.body.totalApplications)"
Chk "Interview count decreased to 1" ($s1_del.body.interview -eq 1) "got $($s1_del.body.interview)"

# ---- 6. RECENT APPLICATIONS ----
Write-Host "`n=== 6. Recent Applications Endpoint ===" -ForegroundColor Cyan

$recent = DoGet "/api/dashboard/recent" $T1
Chk "Recent applications -> 200" ($recent.ok)
Chk "Recent applications returned list <= 5" ($recent.body.Count -le 5) "count=$($recent.body.Count)"
# Most recent should be Comp6 (2026-01-06)
Chk "Most recent application is Comp6" ($recent.body[0].companyName -eq "Comp6") "got $($recent.body[0].companyName)"

# ---- 7. REGRESSION (Phase 1-4 Endpoints) ----
Write-Host "`n=== 7. Phase 1-4 Regression ===" -ForegroundColor Cyan

$appGet = DoGet "/api/applications?page=0&size=10" $T1
Chk "GET /api/applications pagination -> 200" ($appGet.ok)
Chk "Paged content count matches total" ($appGet.body.totalElements -eq 5)

$search = DoGet "/api/applications?search=Comp6" $T1
Chk "Search filter -> 200" ($search.ok)
Chk "Search matches 1 record" ($search.body.totalElements -eq 1)

# ---- SUMMARY ----
Write-Host "`n============================================================" -ForegroundColor Cyan
Write-Host "PHASE 5 TEST RESULTS" -ForegroundColor Cyan
Write-Host "  Passed : $PASS" -ForegroundColor Green
Write-Host "  Failed : $FAIL" -ForegroundColor $(if ($FAIL -eq 0) {"Green"} else {"Red"})
Write-Host "============================================================" -ForegroundColor Cyan
