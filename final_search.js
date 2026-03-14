const fs = require('fs');
const path = require('path');

function search(dir) {
    const files = fs.readdirSync(dir);
    for (const file of files) {
        const fullPath = path.join(dir, file);
        if (fs.statSync(fullPath).isDirectory()) {
            if (file !== 'node_modules' && file !== '.next' && file !== '.git') {
                search(fullPath);
            }
        } else if (file.match(/\.(ts|tsx|js|jsx|json|md|env|env\.local)$/)) {
            try {
                const content = fs.readFileSync(fullPath, 'utf8');
                if (content.match(/교통|ITS|날씨 지도|its\.go\.kr|data\.go\.kr/i)) {
                    console.log(`Match in: ${fullPath}`);
                }
            } catch (e) {}
        }
    }
}

search('d:/orbit');
console.log("Final search complete.");
