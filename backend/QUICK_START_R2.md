# 🚀 Guide rapide - Configuration R2 et test

## Étape 1: Configurer Cloudflare R2

1. **Créer un bucket R2**
   - Allez sur https://dash.cloudflare.com
   - R2 → Create bucket
   - Donnez un nom à votre bucket (ex: `plateforme-files`)

2. **Générer des API tokens**
   - R2 → Manage R2 API Tokens → Create API token
   - Permissions: `Object Read & Write` + `Bucket Read & Write`
   - Copiez l'Access Key ID et Secret Access Key

3. **Récupérer votre Account ID**
   - Dans le dashboard Cloudflare, regardez l'URL ou les paramètres de votre compte
   - Format: `https://dash.cloudflare.com/{account-id}/r2`

## Étape 2: Configurer les variables d'environnement

### En local (fichier `.env`)

Créez ou modifiez `backend/.env`:

```bash
# Cloudflare R2 Configuration
R2_ACCOUNT_ID=votre-account-id-cloudflare
R2_ACCESS_KEY_ID=votre-access-key-id
R2_SECRET_ACCESS_KEY=votre-secret-access-key
R2_BUCKET_NAME=nom-de-votre-bucket
```

### Sur Railway

1. Allez dans votre projet Railway
2. Variables → Add Variable
3. Ajoutez les 4 variables ci-dessus

## Étape 3: Tester la connexion

```bash
cd backend
node scripts/test-r2-upload.js
```

Ce script va:
- ✅ Vérifier les variables d'environnement
- ✅ Tester la connexion au bucket
- ✅ Uploader un fichier de test
- ✅ Uploader un fichier de documentation

## Étape 4: Uploader tous les fichiers de documentation

```bash
cd backend
node scripts/upload-docs-to-r2.js
```

Ce script va uploader:
- `FILE_MANAGER_README.md`
- `ENV_EXAMPLE.md`
- `README.md` (si présent)

## Étape 5: Tester l'API

Une fois les variables configurées, testez l'API:

```bash
# 1. Obtenir un token JWT (via login)
# 2. Uploader un fichier
curl -X POST http://localhost:3000/api/files/upload \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -F "files=@chemin/vers/fichier.pdf"

# 3. Lister les fichiers
curl http://localhost:3000/api/files \
  -H "Authorization: Bearer YOUR_TOKEN"
```

## Dépannage

### Erreur: "Variables R2 manquantes"
→ Vérifiez que toutes les variables sont définies dans `.env` ou Railway

### Erreur: "Access Denied" ou 403
→ Vérifiez que les API tokens ont les bonnes permissions

### Erreur: "Bucket not found"
→ Vérifiez le nom du bucket dans `R2_BUCKET_NAME`

### Erreur: "Invalid endpoint"
→ Vérifiez que `R2_ACCOUNT_ID` est correct

## URLs publiques

Par défaut, les fichiers sont accessibles via:
```
https://{bucket}.{account-id}.r2.cloudflarestorage.com/{key}
```

Pour utiliser un domaine public R2 (bucket public) ou un custom domain:
1. Configurez un bucket public (r2.dev) ou un custom domain dans Cloudflare R2
2. Ajoutez l'une des variables suivantes:
   - `R2_PUBLIC_DOMAIN=pub-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx.r2.dev`
   - `R2_PUBLIC_URL=https://pub-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx.r2.dev`

## Support

Voir `FILE_MANAGER_README.md` pour la documentation complète.


