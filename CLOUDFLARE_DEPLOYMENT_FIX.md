# Configuration Cloudflare Pages

## Structure correcte pour le déploiement
- Root directory: `frontend` (pas `ecom-frontend`)
- Build command: `npm run build`
- Build output directory: `dist`

## Correction du problème de déploiement
L'erreur "Cannot find cwd: /opt/buildhome/repo/ecom-frontend" indique que Cloudflare Pages cherche le mauvais dossier.

### Solution:
Dans Cloudflare Pages Dashboard:
1. Root directory: `frontend`
2. Build command: `npm run build`
3. Build output directory: `dist`
4. Node version: `18`

## Fichiers de configuration présents:
- ✅ `frontend/public/_redirects` - Pour le routing SPA
- ✅ `frontend/public/_headers` - Pour le cache
- ✅ `frontend/package.json` - Dépendances et scripts
- ✅ `frontend/vite.config.js` - Configuration Vite
