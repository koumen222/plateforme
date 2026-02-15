// Script pour créer un package.json propre
const fs = require('fs');

const packageJson = {
  name: "safitech-cloudflare-pages",
  version: "1.0.0",
  scripts: {
    build: "cd frontend && npm install && npm run build && cp -r dist/* . && cp public/manifest.json . && cp public/sw.js ."
  },
  engines: {
    node: ">=18"
  }
};

fs.writeFileSync('package.json', JSON.stringify(packageJson, null, 2), 'utf8');
console.log('✅ package.json créé avec un encodage UTF-8 propre');
