$htmlFiles = Get-ChildItem -Filter *.html

$newHeader = @"
    <header>
        <div class="navbar">
            <a href="index.html" class="logo-container" style="display: flex; align-items: center; gap: 1rem; text-decoration: none;">
                <img src="assets/logo.png" alt="G-Immobilien Logo" class="logo-image" onerror="this.src='https://placehold.co/200x50/0d47a1/ffffff?text=G-Immobilien'">
            </a>
            
            <div class="menu-toggle" id="mobile-menu">
                <span></span>
                <span></span>
                <span></span>
            </div>

            <ul class="nav-links">
                <li class="dropdown category-item">
                    <a href="#" style="cursor: default;">Kategorien ▾</a>
                    <div class="dropdown-content">
                        <a href="einstellplaetze.html">Einstellplätze</a>
                        <a href="parkplaetze.html">Parkplätze</a>
                        <a href="lagerraeume.html">Lagerräume</a>
                        <a href="werkstaetten.html">Werkstätten</a>
                        <a href="tierflaechen.html">Tierflächen</a>
                        <a href="outdoorflaechen.html">Garten & Outdoor</a>
                    </div>
                </li>
                <li id="auth-nav-item"><a href="login.html" class="btn btn-primary" style="color: white; padding: 0.4rem 1rem;">Login / Registrieren</a></li>
            </ul>
        </div>
    </header>
"@

foreach ($file in $htmlFiles) {
    # Read entire file content
    $content = [System.IO.File]::ReadAllText($file.FullName, [System.Text.Encoding]::UTF8)
    
    # Use regex to find <header>...</header> and replace it
    $newContent = [regex]::Replace($content, "(?s)<header>.*?</header>", $newHeader)
    
    if ($newContent -ne $content) {
        [System.IO.File]::WriteAllText($file.FullName, $newContent, [System.Text.Encoding]::UTF8)
        Write-Host "Updated $($file.Name)"
    } else {
        Write-Host "Skipped $($file.Name) (No change needed)"
    }
}
