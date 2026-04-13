$oldNavPattern = '(?s)<div class="dropdown-content">.*?einstellplaetze\.html.*?</div>'

$newNav = '<div class="dropdown-content">
                        <a href="search.html?kategorie=Plätze für Fahrzeuge"><b>Plätze für Fahrzeuge</b></a>
                        <a href="search.html?kategorie=Unüberdachte Plätze" style="padding-left: 2rem !important; font-size: 0.9rem;">└ Unüberdachte Plätze</a>
                        <a href="search.html?kategorie=Überdachte Plätze: Garagen" style="padding-left: 2rem !important; font-size: 0.9rem;">└ Garagen & Carports</a>
                        
                        <a href="search.html?kategorie=Lagerräume & Container">Lagerräume & Container</a>
                        <a href="search.html?kategorie=Werkstätten & Hobbyräume">Werkstätten & Hobbyräume</a>
                        <a href="search.html?kategorie=Tierflächen (Weiden, Ställe)">Tierflächen</a>
                        <a href="search.html?kategorie=Garten & Outdoorflächen">Garten & Outdoor</a>
                    </div>'

$files = Get-ChildItem -Filter *.html
foreach ($file in $files) {
    $content = Get-Content $file.FullName -Raw
    if ($content -match $oldNavPattern) {
        $content = [regex]::Replace($content, $oldNavPattern, $newNav)
        Set-Content -Path $file.FullName -Value $content -Encoding UTF8
        Write-Host "Updated $($file.Name)"
    }
}
