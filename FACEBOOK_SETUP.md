# Configuration Facebook OAuth

## Variables d'environnement requises

Ajoutez ces variables dans votre fichier `.env` du backend :

```bash
FACEBOOK_APP_ID=votre_app_id_facebook
FACEBOOK_APP_SECRET=votre_app_secret_facebook
BACKEND_URL=http://localhost:3000
FRONTEND_URL=http://localhost:5173
```

## Étapes de configuration

### 1. Créer une application Facebook

1. Allez sur [Facebook Developers](https://developers.facebook.com/)
2. Cliquez sur "Mes applications" → "Créer une application"
3. Sélectionnez "Business" comme type d'application
4. Remplissez les informations de base

### 2. Configurer Facebook Login

1. Dans votre application, allez dans "Ajouter un produit"
2. Ajoutez "Facebook Login"
3. **⚠️ IMPORTANT : Mode développement**
   - Assurez-vous que votre application est en **"Mode développement"** (en haut à droite)
   - En mode développement, les redirections `http://localhost` sont **automatiquement autorisées**
   - **Vous n'avez PAS besoin** d'ajouter manuellement les URLs de redirection pour localhost
   
4. **Pour la production uniquement** (quand vous passerez en mode "En direct") :
   - Allez dans "Facebook Login" → "Paramètres"
   - Dans la section **"URL de redirection OAuth valides"**, ajoutez :
     ```
     https://votre-domaine.com/auth/facebook/callback
     ```

### 3. Obtenir les identifiants

1. Allez dans "Paramètres" → "De base"
2. Copiez votre **ID d'application** → `FACEBOOK_APP_ID`
3. Copiez votre **Clé secrète de l'application** → `FACEBOOK_APP_SECRET`

### 4. Configurer les permissions

Dans "Produits" → "Facebook Login" → "Paramètres" :

- Activez les permissions suivantes :
  - `business_management`
  - `ads_read`
  - `ads_management`
  - `read_insights`

### 5. Tester en mode développement

1. Ajoutez votre compte Facebook comme "Testeur" ou "Administrateur"
2. Activez le "Mode développement" pour tester sans soumission

### 6. Redémarrer le serveur

Après avoir ajouté les variables dans `.env`, redémarrez le serveur backend :

```bash
cd backend
npm start
```

## Vérification

Une fois configuré, vous devriez voir dans les logs :

```
✅ Routes Facebook Auth chargées (priorité)
   Route OAuth: GET /auth/facebook
   Route Callback: GET /auth/facebook/callback
```

## Dépannage

### Erreur "Configuration Facebook manquante"

- Vérifiez que les variables sont bien dans `.env`
- Vérifiez qu'il n'y a pas d'espaces autour du `=`
- Redémarrez le serveur après modification de `.env`

### Erreur "Invalid OAuth redirect_uri"

- Vérifiez que l'URL de callback est bien ajoutée dans Facebook Developers
- L'URL doit correspondre exactement (avec ou sans `/` à la fin)

### Erreur "App Not Setup"

- Vérifiez que Facebook Login est bien ajouté comme produit
- Vérifiez que votre application est en mode développement ou approuvée

