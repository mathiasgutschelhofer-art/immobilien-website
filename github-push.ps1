# github-push.ps1
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

# 1. Dateiaufstellung
Write-Host "Starte Deployment im DACH-Modus..." -ForegroundColor Cyan
$localPath = "C:\Users\gutsc\.gemini\antigravity\scratch\immobilien-website"
$files = Get-ChildItem -Path $localPath -Recurse -File | Where-Object { $_.Name -ne "github-push.ps1" }

foreach ($file in $files) {
    $relPath = $file.FullName.Replace("$localPath\", "").Replace("\", "/")
    Write-Host "Verarbeite: $relPath... " -NoNewline

    # SHA der existierenden Datei abrufen (falls vorhanden)
    $sha = $null
    try {
        $checkUrl = "https://api.github.com/repos/$owner/$repo/contents/$relPath?ref=$branch"
        $checkResponse = Invoke-RestMethod -Uri $checkUrl -Headers $headers -ErrorAction Stop
        $sha = $checkResponse.sha
    } catch {
        # Datei existiert wahrscheinlich noch nicht
    }

    if ($sha) { Write-Host " - SHA gefunden: $sha" -ForegroundColor Gray } else { Write-Host " - Neu (keine SHA)" -ForegroundColor Gray }

    # Inhalt lesen und konvertieren
    $bytes = [System.IO.File]::ReadAllBytes($file.FullName)
    $content64 = [Convert]::ToBase64String($bytes)

    $body = @{
        message = "Sync: $relPath (Patch via Antigravity)"
        content = $content64
        branch  = $branch
    }
    if ($sha) { $body["sha"] = $sha }

    $jsonBody = $body | ConvertTo-Json -Depth 10

    try {
        $putUrl = "https://api.github.com/repos/$owner/$repo/contents/$relPath"
        $response = Invoke-RestMethod -Uri $putUrl -Method Put -Headers $headers -Body $jsonBody -ContentType "application/json"
        Write-Host "[OK]" -ForegroundColor Green
    } catch {
        Write-Host "[Fehler: $($_.Exception.Message)]" -ForegroundColor Red
    }
}

Write-Host "Deployment abgeschlossen!" -ForegroundColor Cyan
