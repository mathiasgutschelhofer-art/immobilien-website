# fix_nav.ps1
# Ersetzt die kaputte Navigation (literal PlÃ¤tze-Strings) mit korrekten Umlauten

$badNav = @'
                    <div class="dropdown-content">
                        <a href="search.html?kategorie=PlÃ¤tze fÃ¼r Fahrzeuge"><b>PlÃ¤tze fÃ¼r Fahrzeuge</b></a>
                        <a href="search.html?kategorie=UnÃ¼berdachte PlÃ¤tze" style="padding-left: 2rem !important; font-size: 0.9rem;">â"" UnÃ¼berdachte PlÃ¤tze</a>
                        <a href="search.html?kategorie=Ãœberdachte PlÃ¤tze: Garagen" style="padding-left: 2rem !important; font-size: 0.9rem;">â"" Garagen & Carports</a>
                        
                        <a href="search.html?kategorie=LagerrÃ¤ume & Container">LagerrÃ¤ume & Container</a>
                        <a href="search.html?kategorie=WerkstÃ¤tten & HobbyrÃ¤ume">WerkstÃ¤tten & HobbyrÃ¤ume</a>
                        <a href="search.html?kategorie=TierflÃ¤chen (Weiden, StÃ¤lle)">TierflÃ¤chen</a>
                        <a href="search.html?kategorie=Garten & OutdoorflÃ¤chen">Garten & Outdoor</a>
                    </div>
'@

$goodNav = @'
                    <div class="dropdown-content">
                        <a href="search.html?kategorie=Plätze für Fahrzeuge"><b>Plätze für Fahrzeuge</b></a>
                        <a href="search.html?kategorie=Unüberdachte Plätze" style="padding-left: 2rem !important; font-size: 0.9rem;">└ Unüberdachte Plätze</a>
                        <a href="search.html?kategorie=Überdachte Plätze: Garagen" style="padding-left: 2rem !important; font-size: 0.9rem;">└ Garagen & Carports</a>
                        
                        <a href="search.html?kategorie=Lagerräume & Container">Lagerräume & Container</a>
                        <a href="search.html?kategorie=Werkstätten & Hobbyräume">Werkstätten & Hobbyräume</a>
                        <a href="search.html?kategorie=Tierflächen (Weiden, Ställe)">Tierflächen</a>
                        <a href="search.html?kategorie=Garten & Outdoorflächen">Garten & Outdoor</a>
                    </div>
'@

$files = Get-ChildItem -Filter *.html
foreach ($file in $files) {
    $content = [System.IO.File]::ReadAllText($file.FullName, [System.Text.Encoding]::UTF8)
    if ($content.Contains($badNav)) {
        $content = $content.Replace($badNav, $goodNav)
        [System.IO.File]::WriteAllText($file.FullName, $content, [System.Text.Encoding]::UTF8)
        Write-Host "Fixed nav: $($file.Name)"
    }
}
Write-Host "Nav-Fix abgeschlossen."
