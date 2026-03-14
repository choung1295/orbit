import fs from 'fs';
import path from 'path';

function searchInDirectory(dir, keyword) {
    const files = fs.readdirSync(dir);
    for (const file of files) {
        const fullPath = path.join(dir, file);
        if (fs.statSync(fullPath).isDirectory()) {
            if (file !== 'node_modules' && file !== '.next' && file !== '.git') {
                searchInDirectory(fullPath, keyword);
            }
        } else if (file.endsWith('.ts') || file.endsWith('.tsx') || file.endsWith('.js') || file.endsWith('.jsx')) {
            const content = fs.readFileSync(fullPath, 'utf8');
            if (content.includes(keyword)) {
                console.log(`Found "${keyword}" in: ${fullPath}`);
            }
        }
    }
}

const keywords = ["교통", "ITS", "날씨 지도", "traffic", "transport"];
for (const keyword of keywords) {
    console.log(`Searching for: ${keyword}`);
    searchInDirectory('d:/orbit/lib', keyword);
    searchInDirectory('d:/orbit/app', keyword);
}
