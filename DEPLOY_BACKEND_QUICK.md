# 🚀 Déploiement Rapide du Backend sur Render

## ⚡ Déploiement en 5 minutes

### 1️⃣ Préparer MongoDB Atlas

1. Allez sur https://cloud.mongodb.com/
2. **Network Access** → **Add IP Address** → **Allow Access from Anywhere** (0.0.0.0/0)
3. **Database** → **Connect** → **Connect your application**
4. Copiez l'URI MongoDB (remplacez `<password>` par votre vrai mot de passe)

### 2️⃣ Déployer sur Render

1. Allez sur https://render.com et connectez votre compte GitHub
2. **New +** → **Web Service**
3. Connectez votre repository `plateforme`
4. Configurez :

```
Name: plateforme-backend
Root Directory: backend
Build Command: npm install
Start Command: npm start
Environment: Node
Plan: Free
```

5. **Environment Variables** → Ajoutez :

```
NODE_ENV=production
PORT=3000
MONGO_URI=mongodb+srv://username:password@cluster0.xxxxx.mongodb.net/plateforme?retryWrites=true&w=majority
JWT_SECRET=votre-secret-tres-long-et-aleatoire-ici
JWT_EXPIRES_IN=7d
FRONTEND_URL=https://votre-frontend.vercel.app
OPENAI_API_KEY=sk-votre-cle-openai (optionnel)
GOOGLE_CLIENT_ID=votre-client-id (optionnel)
GOOGLE_CLIENT_SECRET=votre-client-secret (optionnel)
```

6. Cliquez sur **Create Web Service**

### 3️⃣ Attendre le déploiement

- Surveillez les logs
- Attendez le message : `✅ MongoDB connecté avec succès`
- Votre backend sera disponible sur : `https://plateforme-backend.onrender.com`

### 4️⃣ Tester

Ouvrez dans votre navigateur :
```
https://plateforme-backend.onrender.com/health
```

Vous devriez voir : `{"status":"ok"}`

### 5️⃣ Mettre à jour le frontend

Dans votre frontend (Vercel/Netlify), ajoutez la variable d'environnement :
```
VITE_BACKEND_URL=https://plateforme-backend.onrender.com
```

---

## ⚠️ Important : Garder le service actif (Plan gratuit)

Le plan gratuit de Render met le service en veille après 15 minutes d'inactivité.

**Solution** : Utilisez [UptimeRobot](https://uptimerobot.com/) (gratuit) :
1. Créez un compte
2. Ajoutez un monitor HTTP(s)
3. URL : `https://plateforme-backend.onrender.com/health`
4. Interval : 5 minutes

---

## 📝 Checklist

- [ ] MongoDB Atlas : IP autorisée (0.0.0.0/0)
- [ ] URI MongoDB copiée et testée
- [ ] Service créé sur Render
- [ ] Variables d'environnement configurées
- [ ] Déploiement réussi
- [ ] Test `/health` OK
- [ ] Frontend mis à jour avec nouvelle URL

---

**🎉 Votre backend est maintenant en ligne !**

Pour plus de détails, voir : `backend/DEPLOYMENT_GUIDE.md`

