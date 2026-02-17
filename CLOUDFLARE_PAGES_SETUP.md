# Configuration Cloudflare Pages - Guide Complet

## 📋 Structure du Projet Identifiée

```
plateforme/
├── frontend/          ← Votre application React + Vite
│   ├── package.json   ← Package.json ici
│   ├── vite.config.js
│   ├── dist/          ← Build output (généré après build)
│   └── public/
│       ├── _redirects ← Déjà présent ✅
│       └── _headers    ← Créé pour optimisation cache ✅
├── backend/            ← Backend séparé (non déployé sur Pages)
└── ...
```

## ⚙️ Configuration Cloudflare Pages

### 1. Root Directory
**Valeur à mettre dans Cloudflare Pages :**
```
frontend
```

### 2. Build Command
```
npm run build
```

### 3. Build Output Directory
```
dist
```

### 4. Node Version
```
18
```
*(ou 20 si disponible, selon votre package.json: `>=18 <21`)*

### 5. Environment Variables (si nécessaire)
Si votre app utilise des variables d'environnement, ajoutez-les dans :
**Settings → Environment Variables**

Exemple :
- `VITE_BACKEND_URL` = `https://votre-backend.com`
- `VITE_API_KEY` = `votre-clé`

---

## 📝 Résumé de Configuration

| Champ | Valeur |
|-------|--------|
| **Root directory** | `frontend` |
| **Build command** | `npm run build` |
| **Build output directory** | `dist` |
| **Node version** | `18` (ou `20`) |

---

## ✅ Fichiers de Configuration

### `frontend/public/_redirects` (Déjà présent ✅)
```
/*    /index.html   200
```
Ce fichier permet le routing SPA (Single Page Application) pour React Router.

### `frontend/public/_headers` (Créé ✅)
Ce fichier optimise le cache pour de meilleures performances :
- Assets statiques (JS, CSS, images) : cache 1 an
- `index.html` : pas de cache (toujours frais)
- Headers de sécurité

---

## 🚀 Étapes de Déploiement

1. **Connecter votre repository** à Cloudflare Pages
2. **Configurer les paramètres de build** :
   - Root directory : `frontend`
   - Build command : `npm run build`
   - Build output directory : `dist`
   - Node version : `18`
3. **Ajouter les variables d'environnement** (si nécessaire)
4. **Déployer** : Cloudflare Pages va automatiquement :
   - Installer les dépendances (`npm install`)
   - Exécuter le build (`npm run build`)
   - Déployer le dossier `dist`

---

## 🔍 Vérification Post-Déploiement

Après le déploiement, vérifiez :
- ✅ Le site charge correctement
- ✅ Le routing SPA fonctionne (navigation entre pages)
- ✅ Les assets sont bien servis (images, CSS, JS)
- ✅ Le cache fonctionne (vérifier les headers dans DevTools)

---

## 🐛 Dépannage

### Erreur : "Could not read package.json"
**Solution** : Vérifiez que le champ "Root directory" est bien `frontend` (sans slash)

### Erreur : "Build failed"
**Solution** : 
- Vérifiez les logs de build dans Cloudflare Pages
- Assurez-vous que Node version est 18 ou 20
- Vérifiez que toutes les dépendances sont dans `package.json`

### Routing ne fonctionne pas
**Solution** : Vérifiez que `frontend/public/_redirects` contient bien :
```
/*    /index.html   200
```

### Assets non chargés
**Solution** : Vérifiez que les chemins dans votre code utilisent `/` au début (ex: `/img/logo.svg`)

---

## 📚 Documentation Cloudflare Pages

- [Cloudflare Pages Docs](https://developers.cloudflare.com/pages/)
- [SPA Routing](https://developers.cloudflare.com/pages/platform/redirects/)
- [Headers & Cache](https://developers.cloudflare.com/pages/platform/headers/)

