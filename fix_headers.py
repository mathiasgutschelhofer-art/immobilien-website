import os
import re

html_files = [f for f in os.listdir('.') if f.endswith('.html')]

new_header = """    <header>
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
    </header>"""

for f in html_files:
    with open(f, 'r', encoding='utf-8') as file:
        content = file.read()
    
    # Use regex to find <header>...</header> and replace it
    new_content = re.sub(r'<header>.*?</header>', new_header, content, flags=re.DOTALL)
    
    # Just in case some files lack <header> tags, though they all should have them
    if new_content != content:
        with open(f, 'w', encoding='utf-8') as file:
            file.write(new_content)
        print(f"Updated {f}")
    else:
        print(f"Skipped {f} (No <header> block or identical)")
