import os

old_content = """                <li><a href="register.html" class="btn" style="background: linear-gradient(135deg, #ff9800, #f57c00); color: white; padding: 0.4rem 1rem; border-radius: 50px; font-weight: 700; text-decoration: none;" onclick="sessionStorage.setItem(''pendingAction'', ''new-listing'');">Jetzt Inserieren</a></li>"""
new_content = """                <li id="inserieren-nav-item"><a href="register.html" class="btn" style="background: linear-gradient(135deg, #ff9800, #f57c00); color: white; padding: 0.4rem 1rem; border-radius: 50px; font-weight: 700; text-decoration: none;" onclick="sessionStorage.setItem('pendingAction', 'new-listing');">Jetzt Inserieren</a></li>"""

for filename in os.listdir('.'):
    if filename.endswith('.html'):
        with open(filename, 'r', encoding='utf-8') as f:
            content = f.read()
        
        if old_content in content:
            print(f"Updating {filename}")
            updated = content.replace(old_content, new_content)
            with open(filename, 'w', encoding='utf-8', newline='') as f:
                f.write(updated)
        else:
            # Try with single quotes version if double was already fixed but ID missing
            old_alt = old_content.replace("''", "'")
            if old_alt in content:
                print(f"Updating (alt) {filename}")
                updated = content.replace(old_alt, new_content)
                with open(filename, 'w', encoding='utf-8', newline='') as f:
                    f.write(updated)
