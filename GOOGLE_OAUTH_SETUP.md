# Configuration Google OAuth

## Étapes pour configurer l'authentification Google

### 1. Créer un projet Google Cloud

1. Allez sur [Google Cloud Console](https://console.cloud.google.com/)
2. Créez un nouveau projet ou sélectionnez un projet existant
3. Activez l'API "Google+ API" ou "Google Identity Services"

### 2. Configurer les identifiants OAuth 2.0

1. Allez dans **APIs & Services** > **Credentials**
2. Cliquez sur **Create Credentials** > **OAuth client ID**
3. Sélectionnez **Web application**
4. Configurez :
   - **Name** : Plateforme Formation (ou le nom de votre choix)
   - **Authorized JavaScript origins** :
     - `http://localhost:5173` (développement frontend)
     - `http://localhost:3000` (développement backend)
     - `https://www.safitech.shop` (production frontend)
     - `https://plateforme-r1h7.onrender.com` (production backend Render)
   - **Authorized redirect URIs** :
     - `http://localhost:3000/auth/google/callback` (développement)
     - `https://www.safitech.shop/auth/google/callback` (production avec domaine personnalisé)
     - `https://plateforme-r1h7.onrender.com/auth/google/callback` (production Render - **OBLIGATOIRE**)
5. Cliquez sur **Create**
6. Copiez le **Client ID** généré

### 3. Configurer les variables d'environnement

#### Backend (.env)
```env
GOOGLE_CLIENT_ID=1001981040159-an283jv5dfi5c94g0dkj5agdujn3rs34.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=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
```

#### Frontend (.env)
```env
VITE_GOOGLE_CLIENT_ID=1001981040159-an283jv5dfi5c94g0dkj5agdujn3rs34.apps.googleusercontent.com
```

**Note :** Le client_id est déjà configuré par défaut dans `config.js`. Vous pouvez le surcharger avec une variable d'environnement si nécessaire.

### 4. Redémarrer les serveurs

Après avoir configuré les variables d'environnement, redémarrez :
- Le serveur backend
- Le serveur frontend (Vite)

### 5. Tester l'authentification

1. Allez sur la page de connexion/inscription
2. Cliquez sur le bouton "Continuer avec Google"
3. Sélectionnez votre compte Google
4. Autorisez l'application
5. Vous devriez être connecté automatiquement

## Configuration pour Render

Si votre backend est hébergé sur Render (comme `https://plateforme-r1h7.onrender.com`) :

1. **Render définit automatiquement** la variable d'environnement `RENDER_EXTERNAL_URL`
2. Le code détecte automatiquement cette URL et l'utilise pour le callback OAuth
3. **IMPORTANT** : Vous devez ajouter l'URL de callback Render dans Google Cloud Console :
   - `https://plateforme-r1h7.onrender.com/auth/google/callback`

### Vérification de la configuration

Après le déploiement sur Render, vérifiez les logs au démarrage. Vous devriez voir :
```
🔐 Configuration Google OAuth:
   - Client ID: 1001981040159-an283jv5dfi5c94g0dkj5agdujn3rs34...
   - Callback URL: https://plateforme-r1h7.onrender.com/auth/google/callback
   - RENDER_EXTERNAL_URL: https://plateforme-r1h7.onrender.com
```

Si le callback URL n'est pas correct, vous pouvez forcer l'URL avec une variable d'environnement sur Render :
```
GOOGLE_CALLBACK_URL=https://plateforme-r1h7.onrender.com/auth/google/callback
```

## Notes importantes

- Les utilisateurs créés via Google n'ont pas besoin de mot de passe
- Le numéro de téléphone est optionnel pour les utilisateurs Google
- Les comptes créés via Google sont en statut "pending" par défaut (en attente de validation par l'admin)
- Si un utilisateur existe déjà avec le même email, il sera connecté automatiquement
- **Sur Render** : Le backend doit avoir `trust proxy` activé (déjà configuré automatiquement)

