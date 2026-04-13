const fs = require('fs');
const path = require('path');

const directory = 'c:/Users/gutsc/.gemini/antigravity/scratch/immobilien-website';
const files = fs.readdirSync(directory);

files.forEach(file => {
    if (file.endsWith('.html') && !['admin.html', 'admin-active.html'].includes(file)) {
        const filePath = path.join(directory, file);
        let content = fs.readFileSync(filePath, 'utf8');
        
        // 1. Remove style attribute from hero section if present
        // 2. Add banner-reveal-hero class to hero section
        if (content.includes('class="hero"')) {
            console.log(`Updating ${file}...`);
            
            // This regex finds the hero section tag, captures its class and style, 
            // and replaces it with the clean classes.
            content = content.replace(/<section\s+class="hero"(\s+style="[^"]*")?>/g, '<section class="hero banner-reveal-hero">');
            
            fs.writeFileSync(filePath, content, 'utf8');
        }
    }
});

console.log('Update complete.');
