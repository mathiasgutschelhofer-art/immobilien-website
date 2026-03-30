$dir = "C:\Users\gutsc\.gemini\antigravity\scratch\immobilien-website"
foreach ($f in Get-ChildItem -Path $dir -Filter "*.html") {
    $c = [System.IO.File]::ReadAllText($f.FullName, [System.Text.Encoding]::UTF8)
    $c = [text.regularexpressions.regex]::Replace($c, '(?m)^\s*<li><a href="kontakt\.html"[^>]*>Kontakt</a></li>\r?\n?', '')
    [System.IO.File]::WriteAllText($f.FullName, $c, [System.Text.Encoding]::UTF8)
}
echo "Done"
