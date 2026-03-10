# 🔧 Dépannage Backend - Erreurs 401 et 404

## ❌ Erreur 401 : Token invalide sur `/api/auth/me`

### Cause
Le token JWT est invalide ou expiré. Cela peut arriver si :
- Le `JWT_SECRET` sur Render ne correspond pas à celui utilisé pour créer le token
- Le token a expiré
- Le token a été créé avec un autre secret

### Solution

1. **Vérifier le JWT_SECRET sur Render**
   - Allez sur votre dashboard Render
   - Ouvrez votre service backend
   - Allez dans **"Environment"**
   - Vérifiez que `JWT_SECRET` est bien défini et identique partout

2. **Générer un nouveau JWT_SECRET**
   ```bash
   # Sur Linux/Mac
   openssl rand -base64 32
   
   # Ou utilisez https://randomkeygen.com/
   ```

3. **Mettre à jour sur Render**
   - Remplacez `JWT_SECRET` dans les variables d'environnement
   - Redéployez le service

4. **Déconnecter et reconnecter les utilisateurs**
   - Les tokens existants seront invalides
   - Les utilisateurs devront se reconnecter

---

## ❌ Erreur 404 : Route `/api/success-radar` non trouvée

### Cause
La route n'est pas chargée ou le backend n'a pas été redéployé avec les dernières modifications.

### Solution

1. **Vérifier que le fichier existe**
   - Le fichier `backend/routes/successRadar.js` doit exister
   - Le fichier `backend/models/WinningProduct.js` doit exister

2. **Vérifier les logs Render**
   - Allez dans l'onglet **"Logs"** sur Render
   - Cherchez : `✅ Routes Success Radar chargées:`
   - Si vous ne voyez pas ce message, la route n'est pas chargée

3. **Vérifier l'import dans server.js**
   ```javascript
   import successRadarRoutes from "./routes/successRadar.js";
   // ...
   app.use("/api", successRadarRoutes);
   ```

4. **Redéployer le backend**
   - Sur Render, allez dans **"Manual Deploy"**
   - Cliquez sur **"Clear build cache & deploy"**
   - Attendez la fin du déploiement

5. **Vérifier que MongoDB est connecté**
   - Dans les logs, cherchez : `✅ MongoDB connecté avec succès`
   - Si MongoDB n'est pas connecté, les routes peuvent ne pas fonctionner

---

## 🔍 Vérifications à faire

### 1. Vérifier les variables d'environnement sur Render

Assurez-vous que toutes ces variables sont définies :

```
NODE_ENV=production
PORT=3000
MONGO_URI=mongodb+srv://...
JWT_SECRET=votre-secret-tres-long
JWT_EXPIRES_IN=7d
FRONTEND_URL=https://votre-frontend.vercel.app
```

### 2. Vérifier les logs de démarrage

Dans les logs Render, vous devriez voir :

```
✅ MongoDB connecté avec succès
✅ Module Success Radar importé: function
✅ Routes Success Radar chargées:
   - GET /api/success-radar
🚀 Backend running on port 3000
```

### 3. Tester l'API directement

```bash
# Tester la route health (sans auth)
curl https://plateforme-r1h7.onrender.com/health

# Devrait retourner: {"status":"ok"}

# Tester avec un token valide
curl -H "Authorization: Bearer VOTRE_TOKEN" \
  https://plateforme-r1h7.onrender.com/api/success-radar
```

---

## 🚀 Solution rapide : Redéploiement complet

1. **Sur Render :**
   - Ouvrez votre service
   - Allez dans **"Settings"**
   - Cliquez sur **"Clear build cache"**
   - Allez dans **"Manual Deploy"**
   - Cliquez sur **"Deploy latest commit"**

2. **Vérifier les logs :**
   - Attendez la fin du build
   - Vérifiez que MongoDB se connecte
   - Vérifiez que les routes sont chargées

3. **Tester :**
   - Ouvrez `https://plateforme-r1h7.onrender.com/health`
   - Devrait retourner `{"status":"ok"}`

---

## 📝 Checklist de vérification

- [ ] `JWT_SECRET` défini sur Render et identique partout
- [ ] `MONGO_URI` correct et MongoDB accessible
- [ ] Backend redéployé avec les dernières modifications
- [ ] Logs montrent que MongoDB est connecté
- [ ] Logs montrent que les routes sont chargées
- [ ] Route `/health` fonctionne
- [ ] Utilisateurs se reconnectent pour obtenir de nouveaux tokens

---

## 💡 Astuce : Vérifier le token côté frontend

Dans la console du navigateur, vérifiez :

```javascript
// Vérifier le token stocké
localStorage.getItem('token')

// Si le token existe mais donne 401, il est probablement invalide
// Solution : déconnecter et reconnecter l'utilisateur
```

