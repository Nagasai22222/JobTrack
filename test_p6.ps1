$BASE = "http://localhost:8080"
$PASS = 0; $FAIL = 0

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

DoPost "/api/auth/register" @{ username="p6u1"; email="p6u1@test.com"; password="password123" } $null | Out-Null
DoPost "/api/auth/register" @{ username="p6u2"; email="p6u2@test.com"; password="password123" } $null | Out-Null

$r1 = DoPost "/api/auth/login" @{ username="p6u1"; password="password123" } $null
Chk "User1 login" ($r1.ok -and $r1.body.token)
$T1 = $r1.body.token

$r2 = DoPost "/api/auth/login" @{ username="p6u2"; password="password123" } $null
Chk "User2 login" ($r2.ok -and $r2.body.token)
$T2 = $r2.body.token

# Create application for User 1
$app1Res = DoPost "/api/applications" @{ companyName="Stark Industries"; jobRole="AI Specialist"; status="APPLIED"; appliedDate="2026-03-01" } $T1
$APP1_ID = $app1Res.body.id
Chk "User1 creates application (ID=$APP1_ID)" ($APP1_ID -ne $null)

# Create application for User 2
$app2Res = DoPost "/api/applications" @{ companyName="Wayne Enterprises"; jobRole="Security Lead"; status="APPLIED"; appliedDate="2026-03-02" } $T2
$APP2_ID = $app2Res.body.id
Chk "User2 creates application (ID=$APP2_ID)" ($APP2_ID -ne $null)

# ---- 1. AUTHENTICATION ----
Write-Host "`n=== 1. Authentication ===" -ForegroundColor Cyan

$t = DoGet "/api/applications/$APP1_ID/comments" $null
Chk "1. Unauthenticated comment request -> 401" ($t.code -eq 401) "got $($t.code)"

$t = DoGet "/api/applications/$APP1_ID/comments" "invalid.jwt.token"
Chk "2. Invalid JWT -> 401" ($t.code -eq 401) "got $($t.code)"

# ---- 2. COMMENTS CRUD & VALIDATION ----
Write-Host "`n=== 2. Comments CRUD & Validation ===" -ForegroundColor Cyan

# 3. Add valid comment
$c1 = DoPost "/api/applications/$APP1_ID/comments" @{ content="Initial phone screening scheduled for next Monday" } $T1
Chk "3. Add valid comment -> 201" ($c1.code -eq 201 -or $c1.ok) "code=$($c1.code)"
$C1_ID = $c1.body.id
Chk "Comment returned ID" ($C1_ID -ne $null)

# 4. Get comments
$cg = DoGet "/api/applications/$APP1_ID/comments" $T1
Chk "4. Get comments -> 200" ($cg.ok)
Chk "Get comments returned 1 comment" ($cg.body.Count -eq 1)
Chk "Comment content matches" ($cg.body[0].content -eq "Initial phone screening scheduled for next Monday")

# 5. Update own comment
$cu = DoPut "/api/applications/$APP1_ID/comments/$C1_ID" @{ content="Updated: Phone screening rescheduled to Tuesday 10am" } $T1
Chk "5. Update own comment -> 200" ($cu.ok)
Chk "Updated content matches" ($cu.body.content -eq "Updated: Phone screening rescheduled to Tuesday 10am")

# 7. Empty content
$ce1 = DoPost "/api/applications/$APP1_ID/comments" @{ content="" } $T1
Chk "7. Empty content -> 400" ($ce1.code -eq 400) "got $($ce1.code)"

# 8. Blank content
$ce2 = DoPost "/api/applications/$APP1_ID/comments" @{ content="   " } $T1
Chk "8. Blank content -> 400" ($ce2.code -eq 400) "got $($ce2.code)"

# 9. Oversized content (> 2000 chars)
$longStr = "A" * 2001
$ce3 = DoPost "/api/applications/$APP1_ID/comments" @{ content=$longStr } $T1
Chk "9. Oversized content (> 2000 chars) -> 400" ($ce3.code -eq 400) "got $($ce3.code)"

# 10. Nonexistent application
$ce4 = DoPost "/api/applications/9999999/comments" @{ content="Valid comment" } $T1
Chk "10. Nonexistent application -> 404" ($ce4.code -eq 404) "got $($ce4.code)"

# 11. Nonexistent comment
$ce5 = DoPut "/api/applications/$APP1_ID/comments/9999999" @{ content="Updated text" } $T1
Chk "11. Nonexistent comment -> 404" ($ce5.code -eq 404) "got $($ce5.code)"

# 6. Delete own comment (Add temporary comment then delete)
$cTemp = DoPost "/api/applications/$APP1_ID/comments" @{ content="Temporary note to delete" } $T1
$CTEMP_ID = $cTemp.body.id
$cd = DoDel "/api/applications/$APP1_ID/comments/$CTEMP_ID" $T1
Chk "6. Delete own comment -> 204" ($cd.ok -or $cd.code -eq 204)

# ---- 3. OWNERSHIP ISOLATION ----
Write-Host "`n=== 3. Ownership Isolation ===" -ForegroundColor Cyan

# 12. User A cannot comment on User B application
$o1 = DoPost "/api/applications/$APP2_ID/comments" @{ content="Sneaky comment from User1" } $T1
Chk "12. User A cannot comment on User B application -> 403" ($o1.code -eq 403) "got $($o1.code)"

# 13. User A cannot read User B comments
$o2 = DoGet "/api/applications/$APP2_ID/comments" $T1
Chk "13. User A cannot read User B comments -> 403" ($o2.code -eq 403) "got $($o2.code)"

# Add comment for User 2
$cUser2 = DoPost "/api/applications/$APP2_ID/comments" @{ content="User 2 note" } $T2
$C2_ID = $cUser2.body.id

# 14. User A cannot update User B comment
$o3 = DoPut "/api/applications/$APP2_ID/comments/$C2_ID" @{ content="Malicious update" } $T1
Chk "14. User A cannot update User B comment -> 403" ($o3.code -eq 403) "got $($o3.code)"

# 15. User A cannot delete User B comment
$o4 = DoDel "/api/applications/$APP2_ID/comments/$C2_ID" $T1
Chk "15. User A cannot delete User B comment -> 403" ($o4.code -eq 403) "got $($o4.code)"

# 16. User A cannot read User B history
$o5 = DoGet "/api/applications/$APP2_ID/history" $T1
Chk "16. User A cannot read User B history -> 403" ($o5.code -eq 403) "got $($o5.code)"

# ---- 4. ACTIVITY HISTORY ----
Write-Host "`n=== 4. Activity History Timeline ===" -ForegroundColor Cyan

# Update Application 1 status (APPLIED -> INTERVIEW)
DoPut "/api/applications/$APP1_ID" @{ companyName="Stark Industries"; jobRole="AI Specialist"; status="INTERVIEW"; appliedDate="2026-03-01" } $T1 | Out-Null

# Update Application 1 without status change
DoPut "/api/applications/$APP1_ID" @{ companyName="Stark Industries"; jobRole="Lead AI Specialist"; status="INTERVIEW"; appliedDate="2026-03-01" } $T1 | Out-Null

# Fetch history for Application 1
$histRes = DoGet "/api/applications/$APP1_ID/history" $T1
Chk "Fetch application history -> 200" ($histRes.ok)
$hList = $histRes.body

# 17. Application creation generates history
$hCreated = $hList | Where-Object { $_.action -eq "APPLICATION_CREATED" }
Chk "17. Application creation generates history" ($hCreated -ne $null)

# 18. Application update generates history
$hUpdated = $hList | Where-Object { $_.action -eq "APPLICATION_UPDATED" }
Chk "18. Application update generates history" ($hUpdated -ne $null)

# 19. Status change generates history
$hStatus = $hList | Where-Object { $_.action -eq "APPLICATION_STATUS_CHANGED" }
Chk "19. Status change generates history" ($hStatus -ne $null)
Chk "Status change description contains old and new status" ($hStatus.description -like "*from APPLIED to INTERVIEW*") "desc=$($hStatus.description)"

# 20. Unchanged status does not generate status-change event
# (We made 2 updates: 1 status change, 1 non-status update -> total APPLICATION_STATUS_CHANGED count should be 1)
$hStatusCount = @($hList | Where-Object { $_.action -eq "APPLICATION_STATUS_CHANGED" }).Count
Chk "20. Unchanged status update does not generate extra STATUS_CHANGED event" ($hStatusCount -eq 1) "count=$hStatusCount"

# 21. Comment creation generates history
$hCommentAdd = $hList | Where-Object { $_.action -eq "COMMENT_ADDED" }
Chk "21. Comment creation generates history" ($hCommentAdd -ne $null)

# 22. Comment update generates history
$hCommentUp = $hList | Where-Object { $_.action -eq "COMMENT_UPDATED" }
Chk "22. Comment update generates history" ($hCommentUp -ne $null)

# 23. Comment deletion generates history
$hCommentDel = $hList | Where-Object { $_.action -eq "COMMENT_DELETED" }
Chk "23. Comment deletion generates history" ($hCommentDel -ne $null)

# 24. History is ordered newest first
$isOrdered = $true
for ($i = 0; $i -lt ($hList.Count - 1); $i++) {
    $tCurrent = [DateTime]$hList[$i].createdAt
    $tNext = [DateTime]$hList[$i+1].createdAt
    if ($tCurrent -lt $tNext) { $isOrdered = $false }
}
Chk "24. History is ordered newest first (createdAt DESC)" $isOrdered

# ---- SUMMARY ----
Write-Host "`n============================================================" -ForegroundColor Cyan
Write-Host "PHASE 6 TEST RESULTS" -ForegroundColor Cyan
Write-Host "  Passed : $PASS" -ForegroundColor Green
Write-Host "  Failed : $FAIL" -ForegroundColor $(if ($FAIL -eq 0) {"Green"} else {"Red"})
Write-Host "============================================================" -ForegroundColor Cyan
