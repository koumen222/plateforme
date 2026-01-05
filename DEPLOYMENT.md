# Guide de Déploiement - Plateforme Andromeda

## 🚀 Déploiement en Production

### Frontend (Vercel)

1. **Connecter le dépôt GitHub à Vercel**
   - Allez sur [Vercel](https://vercel.com)
   - Connectez votre dépôt GitHub
   - Sélectionnez le dossier `frontend/` comme racine

2. **Configuration Vercel**
   - **Root Directory**: `frontend`
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
   - **Install Command**: `npm install`

3. **Variables d'environnement (optionnel)**
   - `VITE_BACKEND_URL`: URL de votre backend (ex: `https://plateforme-1-93yq.onrender.com`)
   - Si non défini, l'URL par défaut sera utilisée

4. **Déployer**
   - Vercel déploiera automatiquement à chaque push sur `main`
   - L'URL sera : `https://plateforme-zyfr.vercel.app` (ou votre domaine personnalisé)

### Backend (Render)

1. **Créer un compte sur Render**
   - Allez sur [Render](https://render.com)
   - Créez un compte gratuit

2. **Créer un nouveau Web Service**
   - Cliquez sur "New +" → "Web Service"
   - Connectez votre dépôt GitHub
   - Sélectionnez le dépôt `plateforme`

3. **Configuration Render**
   - **Name**: `plateforme-backend`
   - **Environment**: `Node`
   - **Root Directory**: `backend`
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
   - **Plan**: Free (ou Starter pour de meilleures performances)

4. **Variables d'environnement à configurer**
   ```
   NODE_ENV=production
   PORT=3000
   MONGO_URI=mongodb+srv://username:password@cluster.mongodb.net/plateforme?retryWrites=true&w=majority
   JWT_SECRET=votre-secret-jwt-tres-long-et-aleatoire
   JWT_EXPIRES_IN=7d
   OPENAI_API_KEY=sk-votre-cle-openai
   FRONTEND_URL=https://plateforme-zyfr.vercel.app
   ```

5. **Déployer**
   - Render déploiera automatiquement
   - L'URL sera : `https://plateforme-1-93yq.onrender.com` (ou votre nom de service)

### MongoDB Atlas

1. **Créer un cluster MongoDB Atlas**
   - Allez sur [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
   - Créez un compte gratuit
   - Créez un nouveau cluster (gratuit M0)

2. **Configurer l'accès réseau**
   - Dans "Network Access", ajoutez `0.0.0.0/0` pour autoriser toutes les IPs
   - Ou ajoutez l'IP de Render si vous connaissez l'IP statique

3. **Créer un utilisateur de base de données**
   - Dans "Database Access", créez un utilisateur
   - Notez le nom d'utilisateur et le mot de passe

4. **Obtenir l'URI de connexion**
   - Cliquez sur "Connect" → "Connect your application"
   - Copiez l'URI de connexion
   - Remplacez `<password>` par le mot de passe de l'utilisateur
   - Remplacez `<dbname>` par `plateforme` (ou votre nom de base)

5. **Configurer dans Render**
   - Ajoutez `MONGO_URI` dans les variables d'environnement de Render
   - Utilisez l'URI complète avec le mot de passe

## ✅ Vérification après déploiement

### Backend

1. **Tester l'endpoint de santé**
   ```
   GET https://plateforme-1-93yq.onrender.com/health
   ```
   Devrait retourner : `{"status":"ok"}`

2. **Tester l'endpoint de test**
   ```
   GET https://plateforme-1-93yq.onrender.com/api/test
   ```
   Devrait retourner : `{"message":"API backend fonctionne",...}`

3. **Vérifier les logs Render**
   - Allez dans le dashboard Render
   - Vérifiez les logs pour voir si le serveur démarre correctement
   - Vérifiez que MongoDB se connecte

### Frontend

1. **Tester l'application**
   - Ouvrez `https://plateforme-zyfr.vercel.app`
   - Vérifiez que l'application se charge
   - Testez l'inscription/connexion

2. **Vérifier la console du navigateur**
   - Ouvrez les DevTools (F12)
   - Vérifiez qu'il n'y a pas d'erreurs CORS
   - Vérifiez que les requêtes API sont bien envoyées vers le backend

## 🔧 Résolution de problèmes

### Erreur 404 sur /api/register

**Causes possibles :**
1. Le backend n'est pas démarré
2. L'URL du backend est incorrecte
3. Les routes ne sont pas correctement montées

**Solutions :**
1. Vérifiez les logs Render pour voir si le serveur démarre
2. Vérifiez que `MONGO_URI` est correctement configuré
3. Vérifiez que toutes les variables d'environnement sont définies
4. Testez l'endpoint `/health` pour vérifier que le serveur répond

### Erreur CORS

**Solution :**
- Vérifiez que `FRONTEND_URL` dans Render correspond à l'URL Vercel
- Vérifiez que l'URL du frontend est dans `allowedOrigins` dans `server.js`

### Erreur de connexion MongoDB

**Solutions :**
1. Vérifiez que `MONGO_URI` est correct
2. Vérifiez que l'IP de Render est autorisée dans MongoDB Atlas
3. Vérifiez que le nom d'utilisateur et le mot de passe sont corrects

## 📝 Notes importantes

- Le backend sur Render peut prendre quelques secondes à démarrer (cold start)
- Le plan gratuit de Render met le service en veille après 15 minutes d'inactivité
- Pour éviter les cold starts, utilisez un plan payant ou un service de monitoring
- MongoDB Atlas gratuit a des limites (512 MB de stockage)

