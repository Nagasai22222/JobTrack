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

$u1Name = "p4u1_$UID"
$u2Name = "p4u2_$UID"

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

# ---- 1. AUTHENTICATION ----
Write-Host "`n=== 1. Authentication ===" -ForegroundColor Cyan

$t = DoGet "/api/applications" $null
Chk "No JWT -> 401" ($t.code -eq 401) "got $($t.code)"

$t = DoGet "/api/applications" $T1
Chk "Valid USER JWT -> 200" ($t.ok) "got $($t.code)"

$t = DoGet "/api/applications" $TA
Chk "Valid ADMIN JWT -> 200" ($t.ok) "got $($t.code)"

# ---- 2. CRUD ----
Write-Host "`n=== 2. CRUD ===" -ForegroundColor Cyan

$t = DoPost "/api/applications" @{ companyName="Google"; jobRole="Software Engineer"; status="APPLIED"; appliedDate="2026-01-15"; location="Remote"; notes="Referral" } $T1
Chk "Create -> 201" ($t.code -eq 201 -or $t.ok) "got $($t.code) $($t.body)"
$APP1_ID = $t.body.id
Chk "Create returns id" ($APP1_ID -ne $null) "id=$APP1_ID"
Chk "Create: companyName=Google" ($t.body.companyName -eq "Google")
Chk "Create: status=APPLIED" ($t.body.status -eq "APPLIED")

$t = DoGet "/api/applications/$APP1_ID" $T1
Chk "Get by id -> 200" ($t.ok) "got $($t.code)"
Chk "Get: jobRole correct" ($t.body.jobRole -eq "Software Engineer")

$t = DoPut "/api/applications/$APP1_ID" @{ companyName="Google"; jobRole="Senior SWE"; status="INTERVIEW"; appliedDate="2026-01-15" } $T1
Chk "Update -> 200" ($t.ok) "got $($t.code): $($t.body)"
Chk "Update: status=INTERVIEW" ($t.body.status -eq "INTERVIEW")

$td = DoPost "/api/applications" @{ companyName="DelCo"; jobRole="Tmp"; status="WITHDRAWN" } $T1
$DID = $td.body.id
$t = DoDel "/api/applications/$DID" $T1
Chk "Delete -> 204" ($t.ok -or $t.code -eq 204)
$t = DoGet "/api/applications/$DID" $T1
Chk "Get deleted -> 404" ($t.code -eq 404)

# ---- 3. STATUS VALUES ----
Write-Host "`n=== 3. Status Values ===" -ForegroundColor Cyan

foreach ($s in @("APPLIED","SCREENING","INTERVIEW","OFFER","REJECTED","WITHDRAWN")) {
    $t = DoPut "/api/applications/$APP1_ID" @{ companyName="Google"; jobRole="SWE"; status=$s } $T1
    Chk "Status $s accepted" ($t.ok -and $t.body.status -eq $s) "got code=$($t.code) status=$($t.body.status)"
}

$t = DoPut "/api/applications/$APP1_ID" @{ companyName="Google"; jobRole="SWE"; status="BOGUS_STATUS" } $T1
Chk "Invalid status in body -> 400" ($t.code -eq 400) "got $($t.code): $($t.body)"

DoPut "/api/applications/$APP1_ID" @{ companyName="Google"; jobRole="Software Engineer"; status="APPLIED"; appliedDate="2026-01-15" } $T1 | Out-Null

# ---- 4. SEED DATA ----
Write-Host "`n=== 4. Seeding Data ===" -ForegroundColor Cyan

$cnt = 0
@(
    @{companyName="Microsoft"; jobRole="Cloud Architect";          status="INTERVIEW"; appliedDate="2026-02-10"}
    @{companyName="Amazon";    jobRole="Backend Developer";        status="OFFER";     appliedDate="2026-03-05"}
    @{companyName="Meta";      jobRole="Software Engineer";        status="REJECTED";  appliedDate="2026-04-20"}
    @{companyName="Netflix";   jobRole="Senior Software Engineer"; status="APPLIED";   appliedDate="2026-05-01"}
    @{companyName="Apple";     jobRole="iOS Developer";            status="WITHDRAWN"; appliedDate="2026-06-15"}
    @{companyName="Google";    jobRole="Data Scientist";           status="SCREENING"; appliedDate="2026-07-22"}
) | ForEach-Object { if ((DoPost "/api/applications" $_ $T1).ok) { $cnt++ } }
Chk "Seeded 6 apps" ($cnt -eq 6) "seeded $cnt"

# ---- 5. SEARCH ----
Write-Host "`n=== 5. Search ===" -ForegroundColor Cyan

$t = DoGet "/api/applications?search=google" $T1
Chk "Search 'google' finds results" ($t.body.totalElements -ge 1) "got $($t.body.totalElements)"

$t = DoGet "/api/applications?search=ENGINEER" $T1
Chk "Search 'ENGINEER' (case-insensitive)" ($t.body.totalElements -ge 1)

$t = DoGet "/api/applications?search=microsoft" $T1
Chk "Search 'microsoft' finds Microsoft" ($t.body.totalElements -ge 1)

$t = DoGet "/api/applications?search=xyzcompanydoesnotexist123" $T1
Chk "Search no match -> 0 results" ($t.body.totalElements -eq 0) "got $($t.body.totalElements)"

# ---- 6. FILTERING ----
Write-Host "`n=== 6. Filter by Status ===" -ForegroundColor Cyan

$t = DoGet "/api/applications?status=INTERVIEW" $T1
Chk "Filter INTERVIEW: has results" ($t.body.totalElements -ge 1)
$bad = @($t.body.content | Where-Object { $_.status -ne "INTERVIEW" })
Chk "Filter INTERVIEW: all items are INTERVIEW" ($bad.Count -eq 0) "found $($bad.Count) non-INTERVIEW"

$t = DoGet "/api/applications?status=OFFER" $T1
Chk "Filter OFFER: has results" ($t.body.totalElements -ge 1)

$t = DoGet "/api/applications?search=software&status=INTERVIEW" $T1
Chk "Search+filter combo -> 200" ($t.ok) "code=$($t.code)"

$t = DoGet "/api/applications?status=INVALID_STATUS_VALUE" $T1
Chk "Invalid status query param -> 400" ($t.code -eq 400) "got $($t.code): $($t.body)"

# ---- 7. DATE FILTERING ----
Write-Host "`n=== 7. Date Filtering ===" -ForegroundColor Cyan

$t = DoGet "/api/applications?fromDate=2026-03-01" $T1
Chk "fromDate filter -> 200" ($t.ok) "code=$($t.code)"

$t = DoGet "/api/applications?toDate=2026-03-31" $T1
Chk "toDate filter -> 200" ($t.ok)

$t = DoGet "/api/applications?fromDate=2026-02-01&toDate=2026-06-30" $T1
Chk "fromDate+toDate range -> 200" ($t.ok)

$t = DoGet "/api/applications?fromDate=not-a-date" $T1
Chk "Invalid date -> 400" ($t.code -eq 400) "got $($t.code): $($t.body)"

# ---- 8. SORTING ----
Write-Host "`n=== 8. Sorting ===" -ForegroundColor Cyan

$t = DoGet "/api/applications?sortBy=appliedDate&direction=asc&size=50" $T1
Chk "Sort appliedDate asc -> 200" ($t.ok)
$dates = @($t.body.content | Where-Object {$_.appliedDate} | ForEach-Object {$_.appliedDate})
$sorted = @($dates | Sort-Object)
Chk "appliedDate asc: ascending order" (($dates -join ",") -eq ($sorted -join ",")) "dates=$($dates -join ",") expected=$($sorted -join ",")"

$t = DoGet "/api/applications?sortBy=appliedDate&direction=desc&size=50" $T1
Chk "Sort appliedDate desc -> 200" ($t.ok)

$t = DoGet "/api/applications?sortBy=companyName&direction=asc&size=50" $T1
Chk "Sort companyName -> 200" ($t.ok)

$t = DoGet "/api/applications?sortBy=status" $T1
Chk "Sort status -> 200" ($t.ok)

$t = DoGet "/api/applications?sortBy=jobRole" $T1
Chk "Sort jobRole -> 200" ($t.ok)

$t = DoGet "/api/applications?sortBy=unsupportedField" $T1
Chk "Unsupported sort field -> 400" ($t.code -eq 400) "got $($t.code): $($t.body)"

$t = DoGet "/api/applications?direction=sideways" $T1
Chk "Invalid direction -> 400" ($t.code -eq 400) "got $($t.code): $($t.body)"

# ---- 9. PAGINATION ----
Write-Host "`n=== 9. Pagination ===" -ForegroundColor Cyan

$t = DoGet "/api/applications?page=0&size=3" $T1
Chk "Page 0, size 3 -> 200" ($t.ok)
Chk "Page 0: got 3 items" ($t.body.content.Count -eq 3) "got $($t.body.content.Count)"
Chk "Metadata: currentPage=0" ($t.body.currentPage -eq 0) "got $($t.body.currentPage)"
Chk "Metadata: pageSize=3" ($t.body.pageSize -eq 3) "got $($t.body.pageSize)"
Chk "Metadata: totalElements > 0" ($t.body.totalElements -gt 0)
Chk "Metadata: totalPages > 0" ($t.body.totalPages -gt 0)

$t = DoGet "/api/applications?page=1&size=3" $T1
Chk "Page 1: currentPage=1" ($t.body.currentPage -eq 1) "got $($t.body.currentPage)"

$t = DoGet "/api/applications?page=0&size=5" $T1
Chk "Size 5: at most 5 items" ($t.body.content.Count -le 5)

$allRes = DoGet "/api/applications?size=100" $T1
$bigPage = $allRes.body.totalPages + 10
$t = DoGet "/api/applications?page=$bigPage&size=10" $T1
Chk "Beyond last page: empty" ($t.body.content.Count -eq 0) "got $($t.body.content.Count)"

$t = DoGet "/api/applications?size=101" $T1
Chk "size > 100 -> 400" ($t.code -eq 400) "got $($t.code)"

# ---- 10. OWNERSHIP ----
Write-Host "`n=== 10. Ownership ===" -ForegroundColor Cyan

$u2 = DoPost "/api/applications" @{ companyName="Startup"; jobRole="CTO"; status="APPLIED" } $T2
$U2ID = $u2.body.id
Chk "User2 creates app id=$U2ID" ($u2.ok) "$($u2.body)"

$t = DoGet "/api/applications/$U2ID" $T1
Chk "User1 cannot read User2 app -> 403" ($t.code -eq 403) "got $($t.code)"

$t = DoPut "/api/applications/$U2ID" @{ companyName="Startup"; jobRole="CTO"; status="OFFER" } $T1
Chk "User1 cannot update User2 app -> 403" ($t.code -eq 403) "got $($t.code)"

$t = DoDel "/api/applications/$U2ID" $T1
Chk "User1 cannot delete User2 app -> 403" ($t.code -eq 403) "got $($t.code)"

$t = DoGet "/api/applications?size=100" $T1
$x = @($t.body.content | Where-Object {$_.id -eq $U2ID})
Chk "User1 list doesn't include User2 app" ($x.Count -eq 0) "found $($x.Count) crossover apps"

# ---- SUMMARY ----
Write-Host "`n============================================================" -ForegroundColor Cyan
Write-Host "PHASE 4 API TEST RESULTS" -ForegroundColor Cyan
Write-Host "  Passed : $PASS" -ForegroundColor Green
Write-Host "  Failed : $FAIL" -ForegroundColor $(if ($FAIL -eq 0) {"Green"} else {"Red"})
Write-Host "============================================================" -ForegroundColor Cyan
