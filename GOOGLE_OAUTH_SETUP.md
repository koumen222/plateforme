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
     - `http://localhost:5173` (développement)
     - `https://votre-domaine.com` (production)
   - **Authorized redirect URIs** :
     - `http://localhost:5173` (développement)
     - `https://votre-domaine.com` (production)
5. Cliquez sur **Create**
6. Copiez le **Client ID** généré

### 3. Configurer les variables d'environnement

#### Backend (.env)
```env
GOOGLE_CLIENT_ID=votre-client-id-google.apps.googleusercontent.com
```

#### Frontend (.env)
```env
VITE_GOOGLE_CLIENT_ID=votre-client-id-google.apps.googleusercontent.com
```

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

## Notes importantes

- Les utilisateurs créés via Google n'ont pas besoin de mot de passe
- Le numéro de téléphone est optionnel pour les utilisateurs Google
- Les comptes créés via Google sont en statut "pending" par défaut (en attente de validation par l'admin)
- Si un utilisateur existe déjà avec le même email, il sera connecté automatiquement

