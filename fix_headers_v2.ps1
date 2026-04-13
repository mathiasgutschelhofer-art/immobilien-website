$htmlFiles = Get-ChildItem -Filter *.html | Where-Object { $_.Name -ne "header.html" }

# Read the template using strict UTF8
$newHeader = [System.IO.File]::ReadAllText("header.html", [System.Text.Encoding]::UTF8)

# UTF8 without BOM
$utf8NoBom = New-Object System.Text.UTF8Encoding($false)

foreach ($file in $htmlFiles) {
    # Read entire file content
    $content = [System.IO.File]::ReadAllText($file.FullName, [System.Text.Encoding]::UTF8)
    
    # Use regex to find <header>...</header> and replace it
    $newContent = [regex]::Replace($content, "(?s)<header>.*?</header>", $newHeader)
    
    if ($newContent -ne $content) {
        [System.IO.File]::WriteAllText($file.FullName, $newContent, $utf8NoBom)
        Write-Host "Fixed encoding for $($file.Name)"
    } else {
        Write-Host "Skipped $($file.Name) (No change needed)"
    }
}
