$oldHeader = @'
                        <a href="search.html?kategorie=Fahrzeugplätze"><b>Fahrzeugplätze</b></a>
                        <a href="search.html?kategorie=Lagerflächen">Lagerflächen</a>
                        <a href="search.html?kategorie=Tierplätze">Tierplätze</a>
                        <a href="search.html?kategorie=Hobbyräume & Werkstätten">Hobbyräume & Werkstätten</a>
                        <a href="search.html?kategorie=Freiflächen & Garten">Freiflächen & Garten</a>
'@

$newHeader = @'
                        <a href="search.html?hauptgruppe=Plätze"><b>Plätze</b></a>
                        <a href="search.html?hauptgruppe=Fahrzeuge"><b>Fahrzeuge</b></a>
                        <a href="search.html?hauptgruppe=Kleinanzeigen"><b>Kleinanzeigen</b></a>
'@

Get-ChildItem -Filter *.html | ForEach-Object {
    $content = Get-Content $_.FullName -Raw
    if ($content -like "*$oldHeader*") {
        Write-Host "Updating header in $($_.Name)"
        $content = $content.Replace($oldHeader, $newHeader)
        Set-Content $_.FullName $content -NoNewline
    }
}
