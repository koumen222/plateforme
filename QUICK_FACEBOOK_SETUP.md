# Configuration rapide Facebook OAuth

## ⚡ Configuration en 2 minutes

### Étape 1 : Créer le fichier .env (si nécessaire)

Si le fichier `backend/.env` n'existe pas, créez-le :

```bash
cd backend
# Créez le fichier .env
```

### Étape 2 : Ajouter les variables Facebook

Ajoutez ces lignes dans votre fichier `backend/.env` :

```bash
# Facebook OAuth Configuration
FACEBOOK_APP_ID=votre_app_id_ici
FACEBOOK_APP_SECRET=votre_app_secret_ici
BACKEND_URL=http://localhost:3000
FRONTEND_URL=http://localhost:5173
```

### Étape 3 : Obtenir vos identifiants Facebook

1. **Allez sur** [Facebook Developers](https://developers.facebook.com/)
2. **Créez une application** :
   - Cliquez sur "Mes applications" → "Créer une application"
   - Sélectionnez "Business"
3. **Ajoutez Facebook Login** :
   - Dans votre application → "Ajouter un produit"
   - Sélectionnez "Facebook Login"
4. **Configurez les URLs de redirection** :
   - Allez dans "Facebook Login" → "Paramètres"
   - Ajoutez dans "URL de redirection OAuth valides" :
     ```
     http://localhost:3000/auth/facebook/callback
     ```
5. **Récupérez vos identifiants** :
   - Allez dans "Paramètres" → "De base"
   - **ID d'application** → Copiez dans `FACEBOOK_APP_ID`
   - **Clé secrète de l'application** → Cliquez sur "Afficher" et copiez dans `FACEBOOK_APP_SECRET`

### Étape 4 : Redémarrer le serveur

```bash
cd backend
# Arrêtez le serveur (Ctrl+C)
# Puis redémarrez
npm start
```

## ✅ Vérification

Après redémarrage, vous devriez voir dans les logs :

```
✅ Routes Facebook Auth chargées (priorité)
   Route OAuth: GET /auth/facebook
   Route Callback: GET /auth/facebook/callback
```

Et plus d'erreur "Configuration Facebook manquante" !

## 📚 Documentation complète

Pour plus de détails, consultez `backend/FACEBOOK_SETUP.md`

## ⚠️ Mode développement

En mode développement, votre application Facebook doit être en "Mode développement". 
Ajoutez-vous comme testeur dans "Rôles" → "Rôles" → "Ajouter des personnes".

