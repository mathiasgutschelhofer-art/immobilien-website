$htmlFiles = Get-ChildItem -Filter *.html
foreach ($file in $htmlFiles) {
    $content = Get-Content $file.FullName -Raw -Encoding UTF8
    
    if ($content -notmatch "side-banner") {
        # Add CSS link
        if ($content -notmatch "banner.css") {
            $content = $content -replace '(<link rel="stylesheet" href="css/style.css">)', '$1`n    <link rel="stylesheet" href="css/banner.css">'
        }
        
        # Add Banners
        $content = $content -replace '(<body[^>]*>)', '$1`n    <!-- Side Banners -->`n    <div class="side-banner side-banner-left"></div>`n    <div class="side-banner side-banner-right"></div>'
        
        Set-Content $file.FullName $content -Encoding UTF8
        Write-Host "Updated $($file.Name)"
    } else {
        Write-Host "Skipping $($file.Name) - Banners already present."
    }
}
