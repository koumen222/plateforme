# 🚂 Guide de Déploiement Railway - Backend

## Configuration Railway

Le backend est configuré pour être déployé sur Railway avec les fichiers suivants :
- `backend/railway.json` - Configuration Railway
- `backend/Dockerfile` - Alternative avec Docker (si Railway détecte le Dockerfile)

## 📋 Étapes de Déploiement

### Option 1 : Via l'interface Railway (Recommandé)

1. **Connecter votre dépôt GitHub**
   - Allez sur [Railway](https://railway.app/)
   - Cliquez sur "New Project"
   - Sélectionnez "Deploy from GitHub repo"
   - Choisissez votre dépôt `plateforme`

2. **Configurer le service**
   - Railway détectera automatiquement le dossier `backend/`
   - Ou sélectionnez manuellement :
     - **Root Directory**: `backend`
     - **Build Command**: `npm install --production`
     - **Start Command**: `npm start`

3. **Variables d'environnement**
   Configurez les variables suivantes dans Railway (Settings → Variables) :
   ```
   NODE_ENV=production
   PORT=3000
   MONGO_URI=mongodb+srv://username:password@cluster.mongodb.net/plateforme?retryWrites=true&w=majority
   JWT_SECRET=votre-secret-jwt-tres-long-et-aleatoire
   JWT_EXPIRES_IN=7d
   OPENAI_API_KEY=sk-votre-cle-openai
   FRONTEND_URL=https://votre-frontend.com
   GOOGLE_CLIENT_ID=votre-google-client-id (optionnel)
   GOOGLE_CLIENT_SECRET=votre-google-client-secret (optionnel)
   SESSION_SECRET=votre-session-secret (optionnel, utilise JWT_SECRET par défaut)
   ```

4. **Déployer**
   - Railway déploiera automatiquement à chaque push sur `main`
   - L'URL sera générée automatiquement (ex: `https://plateforme-backend-production-2ec6.up.railway.app`)

### Option 2 : Via Railway CLI

```bash
# Installer Railway CLI
npm i -g @railway/cli

# Se connecter
railway login

# Initialiser le projet
railway init

# Déployer
railway up
```

## 🔧 Configuration du Root Directory

Si Railway ne détecte pas automatiquement le dossier `backend/`, configurez-le manuellement :

1. Dans Railway Dashboard → Settings → Service Settings
2. Définir **Root Directory** sur `backend`

## 🐳 Utilisation de Docker (Optionnel)

Si Railway détecte le `Dockerfile` dans `backend/`, il utilisera Docker au lieu de Nixpacks. Le Dockerfile est déjà configuré pour fonctionner correctement.

## ✅ Vérification

Après le déploiement, vérifiez que le backend fonctionne :

```bash
# Test de santé
curl https://plateforme-backend-production-2ec6.up.railway.app/health

# Devrait retourner :
# {"status":"ok"}
```

## 🔗 URL de Déploiement

Votre backend est actuellement déployé sur :
**https://plateforme-backend-production-2ec6.up.railway.app/**

## 📝 Notes Importantes

1. **Port** : Railway définit automatiquement la variable `PORT`. Votre code doit utiliser `process.env.PORT || 3000`

2. **Variables d'environnement** : Toutes les variables sensibles doivent être configurées dans Railway Dashboard, jamais dans le code

3. **Logs** : Consultez les logs dans Railway Dashboard → Deployments → View Logs

4. **Redéploiement** : Railway redéploie automatiquement à chaque push sur la branche connectée

5. **Domaines personnalisés** : Vous pouvez ajouter un domaine personnalisé dans Settings → Domains

## 🐛 Dépannage

### Erreur "Cannot find module"
- Vérifiez que `package.json` existe dans `backend/`
- Vérifiez que le Root Directory est bien `backend`

### Erreur "Port already in use"
- Railway gère automatiquement le port via `process.env.PORT`
- Assurez-vous que votre code utilise `process.env.PORT || 3000`

### Erreur de connexion MongoDB
- Vérifiez que `MONGO_URI` est correctement configuré
- Vérifiez que MongoDB Atlas autorise les connexions depuis Railway (0.0.0.0/0)

### Build échoue
- Consultez les logs dans Railway Dashboard
- Vérifiez que toutes les dépendances sont dans `dependencies` et non `devDependencies`

