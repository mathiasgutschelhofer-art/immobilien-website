# global_fix.ps1 - Korrigierte Version
# Repariert kaputte Umlaute in allen HTML-Dateien und speichert als UTF-8

$replacements = @{
    'Ã¤' = 'ä'
    'Ã¶' = 'ö'
    'Ã¼' = 'ü'
    'Ã„' = 'Ä'
    'Ã–' = 'Ö'
    'Ãœ' = 'Ü'
    'ÃŸ' = 'ß'
    'â–¾' = '▾'
    'â""' = '└'
}

$files = Get-ChildItem -Filter *.html
foreach ($file in $files) {
    if ($file.Name.StartsWith("restore_") -or $file.Name -eq "header.html" -or $file.Name -eq "footer.html") { continue }
    
    $content = [System.IO.File]::ReadAllText($file.FullName, [System.Text.Encoding]::UTF8)
    
    $modified = $false
    foreach ($old in $replacements.Keys) {
        if ($content.Contains($old)) {
            $content = $content.Replace($old, $replacements[$old])
            $modified = $true
        }
    }
    
    if ($modified) {
        [System.IO.File]::WriteAllText($file.FullName, $content, [System.Text.Encoding]::UTF8)
        Write-Host "Repaired: $($file.Name)"
    } else {
        Write-Host "OK (keine kaputten Zeichen): $($file.Name)"
    }
}
Write-Host "Fertig!"
