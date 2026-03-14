const fs = require('fs');
const path = require('path');

function search(dir, keywords) {
    const files = fs.readdirSync(dir);
    for (const file of files) {
        const fullPath = path.join(dir, file);
        if (fs.statSync(fullPath).isDirectory()) {
            if (file !== 'node_modules' && file !== '.next' && file !== '.git') {
                search(fullPath, keywords);
            }
        } else {
            const content = fs.readFileSync(fullPath, 'utf8');
            for (const keyword of keywords) {
                if (content.includes(keyword)) {
                    console.log(`Found "${keyword}" in: ${fullPath}`);
                }
            }
        }
    }
}

const keywords = ["교통", "ITS", "날씨 지도", "its.go.kr", "data.go.kr"];
search('d:/orbit', keywords);
console.log("Search complete.");
