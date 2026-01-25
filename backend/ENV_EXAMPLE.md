# Variables d'environnement requises

## Variables existantes
- `JWT_SECRET` - Secret pour les tokens JWT
- `MONGODB_URI` - URI de connexion MongoDB
- `FRONTEND_URL` - URL du frontend
- `OPENAI_API_KEY` - Clé API OpenAI (pour Success Radar)
- `BACKEND_URL` - URL du backend (pour OAuth callbacks)

## Nouvelles variables pour Cloudflare R2 (File Manager)

### Variables requises pour R2
```bash
# Cloudflare R2 Configuration
R2_ACCOUNT_ID=votre-account-id-cloudflare
R2_ACCESS_KEY_ID=votre-access-key-id
R2_SECRET_ACCESS_KEY=votre-secret-access-key
R2_BUCKET_NAME=nom-de-votre-bucket
R2_ENDPOINT=https://votre-account-id.r2.cloudflarestorage.com  # Optionnel, généré automatiquement
R2_PUBLIC_DOMAIN=votre-domaine-personnalise.com  # Optionnel, pour custom domain
# Vous pouvez aussi fournir une URL complète ou un domaine public R2 :
# R2_PUBLIC_DOMAIN=pub-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx.r2.dev
# R2_PUBLIC_URL=https://pub-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx.r2.dev
```

### Variables alternatives (compatibilité Railway)
Si vous utilisez Railway avec des noms de variables différents, ces alternatives sont supportées :
- `R2_ACCOUNT` au lieu de `R2_ACCOUNT_ID`
- `R2_ACCESS_KEY` au lieu de `R2_ACCESS_KEY_ID`
- `R2_SECRET_KEY` au lieu de `R2_SECRET_ACCESS_KEY`
- `R2_BUCKET` au lieu de `R2_BUCKET_NAME`

## Configuration Cloudflare R2

1. Créez un bucket R2 dans votre dashboard Cloudflare
2. Générez des API tokens avec les permissions :
   - `Object Read & Write`
   - `Bucket Read & Write`
3. Configurez un custom domain (optionnel) pour les URLs publiques
4. Ajoutez les variables dans Railway ou votre fichier `.env`

## Nouvelles variables pour Facebook Ads OAuth

### Variables requises pour Facebook OAuth
```bash
# Facebook App Configuration
FACEBOOK_APP_ID=votre_app_id_facebook
FACEBOOK_APP_SECRET=votre_app_secret_facebook
BACKEND_URL=http://localhost:3000  # URL du backend pour les callbacks OAuth
```

### Variables pour Redis (stockage des tokens Meta)
```bash
# Redis Configuration (optionnel, fallback en mémoire si non configuré)
REDIS_URL=redis://localhost:6379
# Ou pour Redis Cloud
REDISCLOUD_URL=redis://username:password@host:port
```

## Notes importantes

- Les fichiers sont stockés dans `users/{userId}/` sur R2
- Taille maximale : 50MB par fichier
- Maximum 10 fichiers par requête
- Les fichiers sont publics par défaut (ACL: public-read)
- Pour des fichiers privés, modifiez `ACL: 'public-read'` dans `backend/middleware/r2Upload.js`

## Configuration Facebook OAuth

1. Créez une application Facebook dans [Facebook Developers](https://developers.facebook.com/)
2. Ajoutez le produit "Facebook Login"
3. Configurez les URLs de redirection :
   - URL de redirection autorisée : `http://localhost:3000/auth/facebook/callback` (dev)
   - URL de redirection autorisée : `https://votre-domaine.com/auth/facebook/callback` (prod)
4. Obtenez votre `App ID` et `App Secret`
5. Les tokens Meta sont stockés dans Redis avec TTL de 30 minutes (1800 secondes)
6. Si Redis n'est pas disponible, le système utilise un fallback en mémoire
