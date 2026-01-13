# Scripts de test et utilitaires

## test-r2-upload.js

Script de test pour vérifier la connexion à Cloudflare R2.

**Usage:**
```bash
node scripts/test-r2-upload.js
```

**Ce que fait le script:**
1. Vérifie les variables d'environnement R2
2. Teste la connexion au bucket
3. Liste les objets existants
4. Upload un fichier de test
5. Upload un fichier de documentation

## upload-docs-to-r2.js

Script pour uploader tous les fichiers de documentation vers R2.

**Usage:**
```bash
node scripts/upload-docs-to-r2.js
```

**Ce que fait le script:**
1. Vérifie les variables d'environnement R2
2. Upload tous les fichiers .md du dossier backend vers R2
3. Génère les URLs publiques
4. Affiche un résumé des fichiers uploadés

## Configuration requise

Avant d'exécuter ces scripts, configurez les variables R2 dans votre `.env`:

```bash
R2_ACCOUNT_ID=votre-account-id
R2_ACCESS_KEY_ID=votre-access-key
R2_SECRET_ACCESS_KEY=votre-secret-key
R2_BUCKET_NAME=nom-de-votre-bucket
```

Voir `ENV_EXAMPLE.md` pour plus de détails.


