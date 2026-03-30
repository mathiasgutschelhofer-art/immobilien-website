import os
import re

directory = r'C:\Users\gutsc\.gemini\antigravity\scratch\immobilien-website'
count = 0
for filename in os.listdir(directory):
    if filename.endswith('.html'):
        filepath = os.path.join(directory, filename)
        with open(filepath, 'r', encoding='utf-8') as file:
            content = file.read()
        
        # Entfernt den exakten HTML-Eintrag für Kontakt aus dem Header (überall, wo das exakte Wort/Titel gesucht wird)
        # Besserer Suchausdruck für mehrzeilige HTML
        new_content = re.sub(r'[ \t]*<li><a href="kontakt\.html"[^>]*>Kontakt</a></li>[ \t]*\r?\n?', '', content)
        
        if new_content != content:
            with open(filepath, 'w', encoding='utf-8') as file:
                file.write(new_content)
            count += 1
            print(f"Updated {filename}")

print(f"Done. Updated {count} files.")
