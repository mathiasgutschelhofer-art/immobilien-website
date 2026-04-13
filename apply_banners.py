import os
import re

def apply_banners_to_html(file_path):
    with open(file_path, 'r', encoding='utf-8') as f:
        content = f.read()

    # Skip if banners already exist
    if 'side-banner' in content:
        print(f"Skipping {file_path} - Banners already present.")
        return

    # Add banner.css link to head
    if 'banner.css' not in content:
        content = re.sub(r'(<link rel="stylesheet" href="css/style.css">)', 
                        r'\1\n    <link rel="stylesheet" href="css/banner.css">', 
                        content)

    # Add banner divs after body tag
    content = re.sub(r'(<body[^>]*>)', 
                    r'\1\n    <!-- Side Banners -->\n    <div class="side-banner side-banner-left"></div>\n    <div class="side-banner side-banner-right"></div>', 
                    content)

    with open(file_path, 'w', encoding='utf-8') as f:
        f.write(content)
    print(f"Updated {file_path}")

def main():
    directory = '.'
    for filename in os.listdir(directory):
        if filename.endswith('.html'):
            apply_banners_to_html(os.path.join(directory, filename))

if __name__ == "__main__":
    main()
