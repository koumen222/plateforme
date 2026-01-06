# Guide de Déploiement en Production

## 🚀 Configuration pour Netlify

### 1. Variables d'environnement à configurer sur Netlify

Allez dans **Site settings → Environment variables** et ajoutez :

```
VITE_BACKEND_URL=https://plateforme-r1h7.onrender.com
```

### 2. Configuration Netlify (déjà dans `netlify.toml`)

```toml
[build]
  base = "frontend"
  command = "npm ci && npm run build"
  publish = "dist"

[build.environment]
  NODE_VERSION = "18"

[[redirects]]
  from = "/*"
  to = "/index.html"
  status = 200
```

## 🚀 Configuration pour Vercel

### 1. Variables d'environnement à configurer sur Vercel

Allez dans **Project Settings → Environment Variables** et ajoutez :

```
VITE_BACKEND_URL=https://plateforme-r1h7.onrender.com
```

### 2. Configuration Vercel (déjà dans `vercel.json`)

Le fichier `vercel.json` est déjà configuré avec :
- Root Directory: `frontend`
- Build Command: `cd frontend && npm install && npm run build`
- Output Directory: `frontend/dist`

## 🔧 Vérifications importantes

### 1. Backend URL

Le backend doit être accessible à : `https://plateforme-r1h7.onrender.com`

### 2. CORS Configuration

Le backend doit autoriser votre domaine frontend. Vérifiez dans `backend/server.js` que votre URL est dans `allowedOrigins`.

### 3. Variables d'environnement Backend (Render)

Sur Render, configurez :
```
NODE_ENV=production
PORT=3000
MONGO_URI=your_mongodb_uri
JWT_SECRET=your_jwt_secret
FRONTEND_URL=https://votre-domaine.netlify.app
```

## 📝 Checklist de déploiement

- [ ] Backend déployé et accessible
- [ ] Variable `VITE_BACKEND_URL` configurée sur Netlify/Vercel
- [ ] Variable `FRONTEND_URL` configurée sur Render
- [ ] CORS configuré pour autoriser le domaine frontend
- [ ] Build réussi sans erreurs
- [ ] Site accessible et fonctionnel

## 🐛 Dépannage

### Erreur 404 sur les routes
- Vérifiez que les redirections SPA sont configurées (`_redirects` ou `vercel.json`)

### Erreur CORS
- Vérifiez que l'URL du frontend est dans `allowedOrigins` du backend
- Vérifiez que `FRONTEND_URL` est bien configuré sur Render

### Erreur 401 (Non autorisé)
- Vérifiez que le token est bien envoyé dans les headers
- Vérifiez que `withCredentials: true` est configuré pour les requêtes axios

### Images ne s'affichent pas
- Vérifiez que `VITE_BACKEND_URL` est correctement configuré
- Vérifiez que les images uploadées sont accessibles via le backend

