import os
import re

header_html = """    <header>
        <div class="navbar">
            <a href="index.html" class="logo-container" style="display: flex; align-items: center; gap: 1rem; text-decoration: none;">
                <img src="assets/logo.svg?v=2" alt="Platz-Börse Logo" class="logo-image" style="height: 48px; width: auto;">
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
                        <a href="search.html?kategorie=Plätze für Fahrzeuge"><b>Plätze für Fahrzeuge</b></a>
                        <a href="search.html?kategorie=Unüberdachte Plätze" style="padding-left: 2rem !important; font-size: 0.9rem;">└ Unüberdachte Plätze</a>
                        <a href="search.html?kategorie=Überdachte Plätze: Garagen" style="padding-left: 2rem !important; font-size: 0.9rem;">└ Garagen & Carports</a>
                        
                        <a href="search.html?kategorie=Lagerräume & Container">Lagerräume & Container</a>
                        <a href="search.html?kategorie=Werkstätten & Hobbyräume">Werkstätten & Hobbyräume</a>
                        <a href="search.html?kategorie=Tierflächen (Weiden, Ställe)">Tierflächen</a>
                        <a href="search.html?kategorie=Garten & Outdoorflächen">Garten & Outdoor</a>
                    </div>
                </li>
                <li id="auth-nav-item"><a href="login.html" class="btn btn-primary" style="color: white; padding: 0.4rem 1rem;">Login / Registrieren</a></li>
            </ul>
        </div>
    </header>"""

footer_html = """    <footer>
        <div class="footer-content">
            <div class="footer-col" style="flex: 2;">
                <h4>Platz-Börse</h4>
                <p style="color: #aaa;">Deutschlands und Österreichs führender Marktplatz für Spezial- und Nischenflächen.</p>
            </div>
            <div class="footer-col" style="flex: 2;">
                <h4>Rechtliches</h4>
                <ul>
                    <li><a href="impressum.html">Impressum</a></li>
                    <li><a href="datenschutz.html">Datenschutzerklärung</a></li>
                    <li><a href="agb.html">AGB</a></li>
                </ul>
            </div>
        </div>
        <div class="footer-bottom">
            &copy; 2026 Vermietung Gutschelhofer. Alle Rechte vorbehalten.
        </div>
    </footer>"""

replacements = {
    'PlÃ¤tze': 'Plätze',
    'fÃ¼r': 'für',
    'UnÃ¼berdachte': 'Unüberdachte',
    'Ãœberdachte': 'Überdachte',
    'LagerrÃ¤ume': 'Lagerräume',
    'WerkstÃ¤tten': 'Werkstätten',
    'HobbyrÃ¤ume': 'Hobbyräume',
    'TierflÃ¤chen': 'Tierflächen',
    'StÃ¤lle': 'Ställe',
    'OutdoorflÃ¤chen': 'Outdoorflächen',
    'Ã–sterreich': 'Österreich',
    'DatenschutzerklÃ¤rung': 'Datenschutzerklärung',
    'BÃ¶rse': 'Börse',
    'â–¾': '▾',
    'â””': '└',
    'Ã¤': 'ä',
    'Ã¶': 'ö',
    'Ã¼': 'ü',
    'ÃŸ': 'ß'
}

def fix_file(path):
    with open(path, 'r', encoding='utf-8', errors='ignore') as f:
        content = f.read()
    
    # 1. Replace header
    content = re.sub(r'(?s)<header>.*?</header>', header_html, content)
    
    # 2. Replace footer (if exists)
    if '<footer>' in content:
        content = re.sub(r'(?s)<footer>.*?</footer>', footer_html, content)
    
    # 3. Global char fixes
    for old, new in replacements.items():
        content = content.replace(old, new)
        
    with open(path, 'w', encoding='utf-8') as f:
        f.write(content)
    print(f"Fixed {path}")

for f in os.listdir('.'):
    if f.endswith('.html') and not f.startswith('restore_'):
        fix_file(f)
