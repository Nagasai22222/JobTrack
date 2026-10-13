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

function UploadFile($path, $filePath, $docType, $token, $overrideName=$null, $overrideMime=$null) {
    $uri = "$BASE$path"
    $boundary = "---------------------------" + [System.Guid]::NewGuid().ToString("N")
    $LF = "`r`n"
    
    $bytes = [System.IO.File]::ReadAllBytes($filePath)
    $fileName = if ($overrideName) { $overrideName } else { [System.IO.Path]::GetFileName($filePath) }
    $mime = if ($overrideMime) { $overrideMime } else { "application/pdf" }

    $body = ""
    $body += "--$boundary$LF"
    $body += "Content-Disposition: form-data; name=`"documentType`"$LF$LF"
    $body += "$docType$LF"
    $body += "--$boundary$LF"
    $body += "Content-Disposition: form-data; name=`"file`"; filename=`"$fileName`"$LF"
    $body += "Content-Type: $mime$LF$LF"

    $enc = [System.Text.Encoding]::UTF8
    $bodyHead = $enc.GetBytes($body)
    $bodyTail = $enc.GetBytes("$LF--$boundary--$LF")

    $fullBody = [byte[]]::new($bodyHead.Length + $bytes.Length + $bodyTail.Length)
    [Array]::Copy($bodyHead, 0, $fullBody, 0, $bodyHead.Length)
    [Array]::Copy($bytes, 0, $fullBody, $bodyHead.Length, $bytes.Length)
    [Array]::Copy($bodyTail, 0, $fullBody, $bodyHead.Length + $bytes.Length, $bodyTail.Length)

    $req = [System.Net.HttpWebRequest]::Create($uri)
    $req.Method = "POST"
    $req.ContentType = "multipart/form-data; boundary=$boundary"
    if ($token) { $req.Headers.Add("Authorization", "Bearer $token") }

    try {
        $st = $req.GetRequestStream()
        $st.Write($fullBody, 0, $fullBody.Length)
        $st.Close()
        $resp = $req.GetResponse()
        $sr = [System.IO.StreamReader]::new($resp.GetResponseStream())
        $raw = $sr.ReadToEnd()
        return @{ ok=$true; code=201; body=($raw | ConvertFrom-Json) }
    } catch [System.Net.WebException] {
        $code = 0
        if ($_.Exception.Response) {
            $code = [int]$_.Exception.Response.StatusCode
        }
        $raw = ""
        if ($_.Exception.Response) {
            try {
                $sr = [System.IO.StreamReader]::new($_.Exception.Response.GetResponseStream())
                $raw = $sr.ReadToEnd()
            } catch {}
        }
        try { $json = $raw | ConvertFrom-Json } catch { $json = $raw }
        return @{ ok=$false; code=$code; body=$json }
    } catch {
        return @{ ok=$false; code=500; body=$_.Exception.Message }
    }
}

# Create temp dummy files
$tmpDir = "$env:TEMP\jobtrack_p7_test"
if (-not (Test-Path $tmpDir)) { New-Item -ItemType Directory -Path $tmpDir | Out-Null }

$pdfPath = "$tmpDir\sample_resume.pdf"
"%PDF-1.4 sample PDF content" | Out-File -FilePath $pdfPath -Encoding ascii

$txtPath = "$tmpDir\cover_letter.txt"
"Dear Hiring Manager, I am applying..." | Out-File -FilePath $txtPath -Encoding ascii

$docxPath = "$tmpDir\notes.docx"
"PK dummy docx zip header content" | Out-File -FilePath $docxPath -Encoding ascii

$exePath = "$tmpDir\malicious.exe"
"MZ dummy executable file content" | Out-File -FilePath $exePath -Encoding ascii

$emptyPath = "$tmpDir\empty.pdf"
"" | Out-File -FilePath $emptyPath -NoNewline -Encoding ascii

# 5.5 MB file
$bigPath = "$tmpDir\oversized.pdf"
$bigBytes = [byte[]]::new(5.5 * 1024 * 1024)
[System.IO.File]::WriteAllBytes($bigPath, $bigBytes)

# ---- SETUP ----
Write-Host "`n=== SETUP ===" -ForegroundColor Cyan

$u1Name = "p7u1_$UID"
$u2Name = "p7u2_$UID"

DoPost "/api/auth/register" @{ username=$u1Name; email="$u1Name@test.com"; password="password123" } $null | Out-Null
DoPost "/api/auth/register" @{ username=$u2Name; email="$u2Name@test.com"; password="password123" } $null | Out-Null

$r1 = DoPost "/api/auth/login" @{ username=$u1Name; password="password123" } $null
Chk "User1 login" ($r1.ok -and $r1.body.token)
$T1 = $r1.body.token

$r2 = DoPost "/api/auth/login" @{ username=$u2Name; password="password123" } $null
Chk "User2 login" ($r2.ok -and $r2.body.token)
$T2 = $r2.body.token

# Create application for User 1
$app1Res = DoPost "/api/applications" @{ companyName="Cyberdyne Systems"; jobRole="Robotics Eng"; status="APPLIED"; appliedDate="2026-04-01" } $T1
$APP1_ID = $app1Res.body.id
Chk "User1 creates application (ID=$APP1_ID)" ($APP1_ID -ne $null)

# Create application for User 2
$app2Res = DoPost "/api/applications" @{ companyName="Oscorp"; jobRole="Genetics Lead"; status="APPLIED"; appliedDate="2026-04-02" } $T2
$APP2_ID = $app2Res.body.id
Chk "User2 creates application (ID=$APP2_ID)" ($APP2_ID -ne $null)

# ---- 1. AUTHENTICATION ----
Write-Host "`n=== 1. Authentication ===" -ForegroundColor Cyan

$uNoAuth = UploadFile "/api/applications/$APP1_ID/documents" $pdfPath "RESUME" $null
Chk "1. Unauthenticated upload -> 401" ($uNoAuth.code -eq 401) "got $($uNoAuth.code)"

$gNoAuth = DoGet "/api/applications/$APP1_ID/documents" $null
Chk "2. Unauthenticated list -> 401" ($gNoAuth.code -eq 401) "got $($gNoAuth.code)"

$dNoAuth = DoGet "/api/applications/$APP1_ID/documents/1/download" $null
Chk "3. Unauthenticated download -> 401" ($dNoAuth.code -eq 401) "got $($dNoAuth.code)"

$delNoAuth = DoDel "/api/applications/$APP1_ID/documents/1" $null
Chk "4. Unauthenticated delete -> 401" ($delNoAuth.code -eq 401) "got $($delNoAuth.code)"

# ---- 2. UPLOAD & VALIDATION ----
Write-Host "`n=== 2. Upload & Validation ===" -ForegroundColor Cyan

# 5. Upload valid PDF
$uPdf = UploadFile "/api/applications/$APP1_ID/documents" $pdfPath "RESUME" $T1
Chk "5. Upload valid PDF -> 201" ($uPdf.code -eq 201) "code=$($uPdf.code)"
$DOC1_ID = $uPdf.body.id
Chk "Returned document ID" ($DOC1_ID -ne $null)
Chk "Document originalFileName matches" ($uPdf.body.originalFileName -eq "sample_resume.pdf")

# 28. Generated stored filename differs from original filename
Chk "28. Generated stored filename differs (not exposed in DTO)" ($uPdf.body.storedFileName -eq $null)

# 6. Upload valid TXT
$uTxt = UploadFile "/api/applications/$APP1_ID/documents" $txtPath "COVER_LETTER" $T1 $null "text/plain"
Chk "6. Upload valid TXT -> 201" ($uTxt.code -eq 201) "code=$($uTxt.code)"
$DOC2_ID = $uTxt.body.id

# 7. Upload valid DOCX
$uDocx = UploadFile "/api/applications/$APP1_ID/documents" $docxPath "OTHER" $T1 $null "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
Chk "7. Upload valid DOCX -> 201" ($uDocx.code -eq 201) "code=$($uDocx.code)"
$DOC3_ID = $uDocx.body.id

# 8. Empty file -> rejected
$uEmpty = UploadFile "/api/applications/$APP1_ID/documents" $emptyPath "RESUME" $T1
Chk "8. Empty file -> 400" ($uEmpty.code -eq 400) "got $($uEmpty.code)"

# 9. Unsupported extension
$uExe = UploadFile "/api/applications/$APP1_ID/documents" $exePath "OTHER" $T1
Chk "9. Unsupported extension (.exe) -> 400" ($uExe.code -eq 400) "got $($uExe.code)"

# 10. Unsupported content type
$uBadMime = UploadFile "/api/applications/$APP1_ID/documents" $pdfPath "RESUME" $T1 $null "application/x-executable"
Chk "10. Unsupported content type -> 400" ($uBadMime.code -eq 400) "got $($uBadMime.code)"

# 11. Oversized file (> 5MB)
$uBig = UploadFile "/api/applications/$APP1_ID/documents" $bigPath "RESUME" $T1
Chk "11. Oversized file (> 5MB) -> 400" ($uBig.code -eq 400) "got $($uBig.code)"

# 12. Invalid document type
$uBadType = UploadFile "/api/applications/$APP1_ID/documents" $pdfPath "INVALID_TYPE" $T1
Chk "12. Invalid document type -> 400" ($uBadType.code -eq 400) "got $($uBadType.code)"

# 26. Path traversal attempt is rejected
$uTrav = UploadFile "/api/applications/$APP1_ID/documents" $pdfPath "RESUME" $T1 "../../etc/passwd"
Chk "26. Path traversal filename -> 400" ($uTrav.code -eq 400) "got $($uTrav.code)"

# 27. Absolute path manipulation is rejected
$uAbs = UploadFile "/api/applications/$APP1_ID/documents" $pdfPath "RESUME" $T1 "C:\Windows\System32\cmd.exe"
Chk "27. Absolute path manipulation -> 400" ($uAbs.code -eq 400) "got $($uAbs.code)"

# ---- 3. RETRIEVAL & DOWNLOAD ----
Write-Host "`n=== 3. Retrieval & Download ===" -ForegroundColor Cyan

# 13. List documents
$docList = DoGet "/api/applications/$APP1_ID/documents" $T1
Chk "13. List documents -> 200" ($docList.ok)
Chk "List count equals 3" ($docList.body.Count -eq 3) "count=$($docList.body.Count)"

# 14. Documents ordered newest first
$isOrdered = $true
for ($i = 0; $i -lt ($docList.body.Count - 1); $i++) {
    $tCurrent = [DateTime]$docList.body[$i].createdAt
    $tNext = [DateTime]$docList.body[$i+1].createdAt
    if ($tCurrent -lt $tNext) { $isOrdered = $false }
}
Chk "14. Documents ordered newest first" $isOrdered

# 15. Download valid document
$dlReq = [System.Net.HttpWebRequest]::Create("$BASE/api/applications/$APP1_ID/documents/$DOC1_ID/download")
$dlReq.Headers.Add("Authorization", "Bearer $T1")
$dlResp = $dlReq.GetResponse()
$dlCode = [int]$dlResp.StatusCode
$dlType = $dlResp.ContentType
$dlDisp = $dlResp.Headers["Content-Disposition"]
$dlResp.Close()

Chk "15. Download valid document -> 200" ($dlCode -eq 200) "code=$dlCode"
Chk "16. Download has correct content type" ($dlType -like "*application/pdf*") "got $dlType"
Chk "17. Download uses safe original filename" ($dlDisp -like "*sample_resume.pdf*") "got $dlDisp"

# ---- 4. OWNERSHIP ISOLATION ----
Write-Host "`n=== 4. Ownership Isolation ===" -ForegroundColor Cyan

# 18. User A cannot upload to User B application
$o1 = UploadFile "/api/applications/$APP2_ID/documents" $pdfPath "RESUME" $T1
Chk "18. User A cannot upload to User B application -> 403" ($o1.code -eq 403) "got $($o1.code)"

# 19. User A cannot list User B documents
$o2 = DoGet "/api/applications/$APP2_ID/documents" $T1
Chk "19. User A cannot list User B documents -> 403" ($o2.code -eq 403) "got $($o2.code)"

# User 2 uploads document to Application 2
$uUser2Doc = UploadFile "/api/applications/$APP2_ID/documents" $pdfPath "RESUME" $T2
$U2_DOC_ID = $uUser2Doc.body.id

# 20. User A cannot download User B document
$o3 = DoGet "/api/applications/$APP2_ID/documents/$U2_DOC_ID/download" $T1
Chk "20. User A cannot download User B document -> 403" ($o3.code -eq 403) "got $($o3.code)"

# 21. User A cannot delete User B document
$o4 = DoDel "/api/applications/$APP2_ID/documents/$U2_DOC_ID" $T1
Chk "21. User A cannot delete User B document -> 403" ($o4.code -eq 403) "got $($o4.code)"

# ---- 5. DELETE ----
Write-Host "`n=== 5. Delete Document ===" -ForegroundColor Cyan

# 22. Delete own document
$delRes = DoDel "/api/applications/$APP1_ID/documents/$DOC3_ID" $T1
Chk "22. Delete own document -> 204" ($delRes.ok -or $delRes.code -eq 204)

# 23. Deleted metadata no longer appears in list
$docListAfter = DoGet "/api/applications/$APP1_ID/documents" $T1
$foundDoc3 = @($docListAfter.body | Where-Object { $_.id -eq $DOC3_ID })
Chk "23. Deleted metadata no longer in list" ($foundDoc3.Count -eq 0)

# 25. Deleting nonexistent document -> 404
$delNonExist = DoDel "/api/applications/$APP1_ID/documents/9999999" $T1
Chk "25. Deleting nonexistent document -> 404" ($delNonExist.code -eq 404) "got $($delNonExist.code)"

# ---- 6. ACTIVITY HISTORY INTEGRATION ----
Write-Host "`n=== 6. Activity History Integration ===" -ForegroundColor Cyan

$histRes = DoGet "/api/applications/$APP1_ID/history" $T1
Chk "Fetch application history -> 200" ($histRes.ok)
$hList = $histRes.body

# 29. Upload generates DOCUMENT_UPLOADED
$hUpload = $hList | Where-Object { $_.action -eq "DOCUMENT_UPLOADED" }
Chk "29. Upload generates DOCUMENT_UPLOADED history event" ($hUpload -ne $null)

# 30. Delete generates DOCUMENT_DELETED
$hDelete = $hList | Where-Object { $_.action -eq "DOCUMENT_DELETED" }
Chk "30. Delete generates DOCUMENT_DELETED history event" ($hDelete -ne $null)

# Clean up temp files
Remove-Item -Recurse -Force $tmpDir -ErrorAction SilentlyContinue

# ---- SUMMARY ----
Write-Host "`n============================================================" -ForegroundColor Cyan
Write-Host "PHASE 7 TEST RESULTS" -ForegroundColor Cyan
Write-Host "  Passed : $PASS" -ForegroundColor Green
Write-Host "  Failed : $FAIL" -ForegroundColor $(if ($FAIL -eq 0) {"Green"} else {"Red"})
Write-Host "============================================================" -ForegroundColor Cyan
