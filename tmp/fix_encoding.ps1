$replacements = @{
    'PlÃ¤tze' = 'Plätze'
    'fÃ¼r' = 'für'
    'UnÃ¼berdachte' = 'Unüberdachte'
    'Ãœberdachte' = 'Überdachte'
    'LagerrÃ¤ume' = 'Lagerräume'
    'WerkstÃ¤tten' = 'Werkstätten'
    'HobbyrÃ¤ume' = 'Hobbyräume'
    'TierflÃ¤chen' = 'Tierflächen'
    'StÃ¤lle' = 'Ställe'
    'OutdoorflÃ¤chen' = 'Outdoorflächen'
    'Ã–sterreich' = 'Österreich'
    'DatenschutzerklÃ¤rung' = 'Datenschutzerklärung'
    'BÃ¶rse' = 'Börse'
    'Ã¤' = 'ä'
    'Ã¶' = 'ö'
    'Ã¼' = 'ü'
    'ÃŸ' = 'ß'
    'â–¾' = '▾'
    'â””' = '└'
    'Ã–' = 'Ö'
    'Ã€' = 'Ä'
    'Ãœ' = 'Ü'
}

$files = Get-ChildItem -Filter *.html
foreach ($file in $files) {
    if ($file.Name -startswith "restore_") { continue }
    
    # Read with explicit UTF8
    $content = [System.IO.File]::ReadAllText($file.FullName, [System.Text.Encoding]::UTF8)
    
    $modified = $false
    foreach ($old in $replacements.Keys) {
        if ($content.Contains($old)) {
            $content = $content.Replace($old, $replacements[$old])
            $modified = $true
        }
    }
    
    if ($modified) {
        # Write back with explicit UTF8
        [System.IO.File]::WriteAllText($file.FullName, $content, [System.Text.Encoding]::UTF8)
        Write-Host "Fixed: $($file.Name)"
    } else {
        Write-Host "No mangled characters found in: $($file.Name)"
    }
}
