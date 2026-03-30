# github-push-tree.ps1
param(
    [string]$token = "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",
    [string]$owner = "mathiasgutschelhofer-art",
    [string]$repo = "immobilien-website",
    [string]$branch = "main"
)

$headers = @{
    "Authorization" = "token $token"
    "Accept"        = "application/vnd.github+json"
}

Write-Host "--- Git Data API Push-Vorgang ---" -ForegroundColor Cyan

# 1. Alle Dateien in Blobs umwandeln
Write-Host "Erstelle Blobs für alle Dateien..."
$localPath = "C:\Users\gutsc\.gemini\antigravity\scratch\immobilien-website"
$files = Get-ChildItem -Path $localPath -Recurse -File | Where-Object { $_.Name -ne "github-push.ps1" -and $_.Name -ne "github-push-tree.ps1" }

$treeEntries = @()
foreach ($file in $files) {
    $relPath = $file.FullName.Replace("$localPath\", "").Replace("\", "/")
    Write-Host "Blob: $relPath... " -NoNewline
    
    $bytes = [System.IO.File]::ReadAllBytes($file.FullName)
    $content64 = [Convert]::ToBase64String($bytes)
    
    $blobBody = @{
        content = $content64
        encoding = "base64"
    } | ConvertTo-Json
    
    $blobResponse = Invoke-RestMethod -Uri "https://api.github.com/repos/$owner/$repo/git/blobs" -Method Post -Headers $headers -Body $blobBody -ContentType "application/json"
    $treeEntries += @{
        path = $relPath
        mode = "100644"
        type = "blob"
        sha  = $blobResponse.sha
    }
    Write-Host "[OK]" -ForegroundColor Green
}

# 2. Den neuen Tree erstellen
Write-Host "Erstelle neuen Tree..."
$treeBody = @{
    tree = $treeEntries
} | ConvertTo-Json -Depth 10

$treeResponse = Invoke-RestMethod -Uri "https://api.github.com/repos/$owner/$repo/git/trees" -Method Post -Headers $headers -Body $treeBody -ContentType "application/json"
$newTreeSha = $treeResponse.sha
Write-Host "New Tree SHA: $newTreeSha" -ForegroundColor Gray

# 3. Den aktuellen HEAD-Commit finden
$branchUrl = "https://api.github.com/repos/$owner/$repo/branches/$branch"
$branchResponse = Invoke-RestMethod -Uri $branchUrl -Headers $headers
$parentCommitSha = $branchResponse.commit.sha

# 4. Den neuen Commit erstellen
Write-Host "Erstelle Commit..."
$commitBody = @{
    message = "Batch-Sync: Umkreissuche & Karussell-Loop (Tree API)"
    tree    = $newTreeSha
    parents = @($parentCommitSha)
} | ConvertTo-Json

$commitResponse = Invoke-RestMethod -Uri "https://api.github.com/repos/$owner/$repo/git/commits" -Method Post -Headers $headers -Body $commitBody -ContentType "application/json"
$newCommitSha = $commitResponse.sha
Write-Host "New Commit SHA: $newCommitSha" -ForegroundColor Gray

# 5. Branch-Referenz aktualisieren (Zwing das Update!)
Write-Host "Aktualisiere Referenz (main)..."
$refBody = @{
    sha = $newCommitSha
    force = $true
} | ConvertTo-Json

Invoke-RestMethod -Uri "https://api.github.com/repos/$owner/$repo/git/refs/heads/$branch" -Method Patch -Headers $headers -Body $refBody -ContentType "application/json"

Write-Host "Deployment erfolgreich abgeschlossen!" -ForegroundColor Green
