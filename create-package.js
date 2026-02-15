// Script pour créer un package.json propre
const fs = require('fs');

const packageJson = {
  name: "safitech-cloudflare-pages",
  version: "1.0.0",
  scripts: {
    build: "cd frontend && npm install && npm run build && ls -la dist && echo '=== Copie des fichiers ===' && cp -r dist/* . && echo '=== Copie PWA ===' && cp public/manifest.json . && cp public/sw.js . && cp public/browserconfig.xml . && mkdir -p icons && cp -r public/icons/* icons/ 2>/dev/null || true && echo '=== Vérification ===' && ls -la | grep -E '(index\\.html|assets|icons|manifest|sw\\.js)'"
  },
  engines: {
    node: ">=18"
  }
};

fs.writeFileSync('package.json', JSON.stringify(packageJson, null, 2), 'utf8');
console.log('✅ package.json créé avec un encodage UTF-8 propre');
