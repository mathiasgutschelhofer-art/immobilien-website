$urlSelect = "https://ncvxdpammwbgybhdlnwd.supabase.co/rest/v1/listings?select=title&limit=1"
$urlInsert = "https://ncvxdpammwbgybhdlnwd.supabase.co/rest/v1/listings"
$key = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5jdnhkcGFtbXdiZ3liaGRsbndkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQ3OTA1MjgsImV4cCI6MjA5MDM2NjUyOH0.oo1x1YTel9rK-9lFKmrKcHOmHZLQ--bXq6n4iBubBdQ"

$headers = @{
    "apikey" = $key
    "Authorization" = "Bearer $key"
    "Content-Type" = "application/json"
}

Write-Host "--- TEST 1: Öffentliches Lesen ---"
try {
    $res = Invoke-RestMethod -Uri $urlSelect -Headers $headers -Method Get
    Write-Host "ERGEBNIS: Erfolg (Korrekt) - Inserate können gelesen werden."
} catch {
    Write-Host "ERGEBNIS: Fehler beim Lesen - $($_.Exception.Message)"
}

Write-Host "`n--- TEST 2: Unbefugtes Erstellen (ohne Login) ---"
$body = @{ title = "SECURITY TEST" } | ConvertTo-Json
try {
    Invoke-RestMethod -Uri $urlInsert -Headers $headers -Method Post -Body $body
    Write-Host "ERGEBNIS: FEHLER! Das Inserat wurde erstellt. RLS ist NICHT aktiv!"
} catch {
    Write-Host "ERGEBNIS: Geblockt (Korrekt) - Sie erhalten eine Fehlermeldung."
    Write-Host "Details: $($_.Exception.Message)"
}

Write-Host "`n--- TEST 3: Unbefugtes Löschen ---"
try {
    $deleteUrl = "https://ncvxdpammwbgybhdlnwd.supabase.co/rest/v1/listings?title=eq.SECURITY%20TEST"
    Invoke-RestMethod -Uri $deleteUrl -Headers $headers -Method Delete
    Write-Host "ERGEBNIS: FEHLER! Löschen war möglich. RLS ist NICHT aktiv!"
} catch {
    Write-Host "ERGEBNIS: Geblockt (Korrekt) - Löschen nicht erlaubt."
}
