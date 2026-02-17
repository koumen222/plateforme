# 🚀 Guide de Déploiement du Backend en Ligne (Render)

Ce guide vous explique comment déployer votre backend Node.js sur Render pour le rendre accessible en ligne.

## 📋 Prérequis

1. Un compte GitHub avec votre code pushé
2. Un compte MongoDB Atlas (gratuit)
3. Un compte Render (gratuit) : https://render.com

---

## 🔧 Étape 1 : Préparer MongoDB Atlas

### 1.1 Autoriser toutes les IP pour le déploiement

1. Allez sur [MongoDB Atlas](https://cloud.mongodb.com/)
2. Sélectionnez votre projet/cluster
3. Cliquez sur **"Network Access"** dans le menu de gauche
4. Cliquez sur **"Add IP Address"**
5. Cliquez sur **"Allow Access from Anywhere"** (0.0.0.0/0)
6. Cliquez sur **"Confirm"**

⚠️ **Note** : Pour la production, vous pouvez restreindre aux IP de Render uniquement, mais pour commencer, autoriser toutes les IP est plus simple.

### 1.2 Obtenir votre URI de connexion

1. Dans MongoDB Atlas, cliquez sur **"Connect"** sur votre cluster
2. Sélectionnez **"Connect your application"**
3. Copiez l'URI (elle ressemble à : `mongodb+srv://username:password@cluster0.xxxxx.mongodb.net/plateforme?retryWrites=true&w=majority`)
4. Remplacez `<password>` par votre mot de passe réel
5. Remplacez `<dbname>` par `plateforme` (ou votre nom de base de données)

---

## 🌐 Étape 2 : Déployer sur Render

### 2.1 Créer un nouveau service Web

1. Connectez-vous à [Render](https://render.com)
2. Cliquez sur **"New +"** → **"Web Service"**
3. Connectez votre repository GitHub si ce n'est pas déjà fait
4. Sélectionnez votre repository `plateforme`

### 2.2 Configurer le service

Remplissez les champs suivants :

- **Name** : `plateforme-backend` (ou le nom de votre choix)
- **Environment** : `Node`
- **Region** : Choisissez la région la plus proche (ex: Frankfurt)
- **Branch** : `main` (ou votre branche principale)
- **Root Directory** : `backend`
- **Build Command** : `npm install`
- **Start Command** : `npm start`

### 2.3 Configurer les variables d'environnement

Dans la section **"Environment Variables"**, ajoutez :

| Variable | Valeur | Description |
|----------|--------|-------------|
| `NODE_ENV` | `production` | Environnement de production |
| `PORT` | `3000` | Port du serveur (Render définit automatiquement PORT) |
| `MONGO_URI` | `mongodb+srv://...` | Votre URI MongoDB Atlas complète |
| `JWT_SECRET` | `votre-secret-tres-long-et-aleatoire` | Clé secrète pour JWT (générez-en une longue et aléatoire) |
| `JWT_EXPIRES_IN` | `7d` | Durée de validité des tokens |
| `FRONTEND_URL` | `https://votre-frontend.vercel.app` | URL de votre frontend déployé |
| `OPENAI_API_KEY` | `sk-...` | Votre clé API OpenAI (si vous utilisez le chatbot) |
| `GOOGLE_CLIENT_ID` | `1001981040159-...` | ID client Google OAuth |
| `GOOGLE_CLIENT_SECRET` | `GOCSPX-...` | Secret client Google OAuth |

**Pour générer un JWT_SECRET sécurisé :**
```bash
# Sur Linux/Mac
openssl rand -base64 32

# Ou utilisez un générateur en ligne
# https://randomkeygen.com/
```

### 2.4 Plan de service

- Sélectionnez le plan **"Free"** pour commencer (gratuit)
- ⚠️ **Note** : Le plan gratuit met le service en veille après 15 minutes d'inactivité

### 2.5 Créer le service

Cliquez sur **"Create Web Service"**

---

## ⏱️ Étape 3 : Attendre le déploiement

1. Render va automatiquement :
   - Cloner votre repository
   - Installer les dépendances (`npm install`)
   - Démarrer le serveur (`npm start`)

2. Surveillez les logs dans l'onglet **"Logs"**
3. Attendez que vous voyiez : `✅ MongoDB connecté avec succès`
4. Une fois déployé, vous obtiendrez une URL comme : `https://plateforme-backend.onrender.com`

---

## ✅ Étape 4 : Vérifier le déploiement

### 4.1 Tester l'API

Ouvrez votre navigateur et allez sur :
```
https://votre-backend.onrender.com/api/health
```

Ou testez avec curl :
```bash
curl https://votre-backend.onrender.com/api/health
```

### 4.2 Vérifier les logs

Dans Render, allez dans l'onglet **"Logs"** et vérifiez :
- ✅ Pas d'erreurs MongoDB
- ✅ Serveur démarré sur le port correct
- ✅ Routes API disponibles

---

## 🔄 Étape 5 : Mettre à jour le frontend

Une fois le backend déployé, mettez à jour votre frontend :

1. Dans votre fichier `.env` du frontend (ou variables d'environnement Vercel/Netlify), ajoutez :
```env
VITE_BACKEND_URL=https://votre-backend.onrender.com
```

2. Redéployez votre frontend

---

## 🐛 Dépannage

### Problème : "Cannot connect to MongoDB"

**Solution :**
1. Vérifiez que votre IP est autorisée dans MongoDB Atlas (0.0.0.0/0)
2. Vérifiez que l'URI MongoDB est correcte dans les variables d'environnement
3. Vérifiez que le mot de passe dans l'URI est correct (sans caractères spéciaux non encodés)

### Problème : "Port already in use"

**Solution :**
Render définit automatiquement la variable `PORT`. Assurez-vous que votre `server.js` utilise :
```javascript
const PORT = process.env.PORT || 3000;
```

### Problème : "Service goes to sleep"

**Solution :**
Le plan gratuit de Render met les services en veille après 15 minutes d'inactivité. Solutions :
1. Utiliser un service de "ping" gratuit comme UptimeRobot pour garder le service actif
2. Passer au plan payant ($7/mois) pour éviter la mise en veille

### Problème : "Build fails"

**Solution :**
1. Vérifiez que `Root Directory` est bien `backend`
2. Vérifiez que `package.json` existe dans le dossier `backend`
3. Vérifiez les logs de build pour voir l'erreur exacte

---

## 📝 Checklist de déploiement

- [ ] MongoDB Atlas configuré avec IP autorisée (0.0.0.0/0)
- [ ] URI MongoDB obtenue et testée
- [ ] Compte Render créé
- [ ] Service Web créé sur Render
- [ ] Variables d'environnement configurées
- [ ] Déploiement réussi
- [ ] Backend accessible via l'URL Render
- [ ] Frontend mis à jour avec la nouvelle URL backend
- [ ] Tests de l'API réussis

---

## 🔗 Ressources

- [Documentation Render](https://render.com/docs)
- [MongoDB Atlas Documentation](https://docs.atlas.mongodb.com/)
- [Guide CORS pour Express](https://expressjs.com/en/resources/middleware/cors.html)

---

## 💡 Astuce : Garder le service actif (Plan gratuit)

Pour éviter que votre service se mette en veille, vous pouvez utiliser [UptimeRobot](https://uptimerobot.com/) :

1. Créez un compte gratuit sur UptimeRobot
2. Ajoutez un nouveau monitor
3. Type : HTTP(s)
4. URL : `https://votre-backend.onrender.com/api/health`
5. Interval : 5 minutes
6. Cela enverra une requête toutes les 5 minutes pour garder le service actif

---

**🎉 Félicitations ! Votre backend est maintenant en ligne !**

