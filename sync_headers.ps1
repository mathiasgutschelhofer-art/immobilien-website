$masterHeader = Get-Content "header.html" -Raw -Encoding UTF8
$htmlFiles = Get-ChildItem -Filter *.html | Where-Object { $_.Name -ne "header.html" }

foreach ($file in $htmlFiles) {
    $content = Get-Content $file.FullName -Raw -Encoding UTF8
    
    # Replace anything between <header> and </header> including tags
    # Using regex to handle potential formatting differences
    if ($content -match "(?s)<header>.*?</header>") {
        $content = [regex]::Replace($content, "(?s)<header>.*?</header>", $masterHeader.Trim())
        Set-Content $file.FullName $content -Encoding UTF8
        Write-Host "Synchronized header in $($file.Name)"
    } else {
        Write-Host "No <header> block found in $($file.Name)"
    }
}
