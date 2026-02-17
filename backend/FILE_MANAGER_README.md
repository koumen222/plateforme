# File Manager - Système de gestion de fichiers

Système complet de gestion de fichiers type Google Drive avec stockage Cloudflare R2.

## Architecture

- **Backend**: Express.js + MongoDB + Cloudflare R2 (S3 compatible)
- **Frontend**: React avec drag & drop
- **Authentification**: JWT middleware existant
- **Stockage**: Cloudflare R2 (compatible S3)

## Installation

### 1. Installer les dépendances

```bash
cd backend
npm install @aws-sdk/client-s3 @aws-sdk/lib-storage multer-s3
```

### 2. Configurer les variables d'environnement

Voir `ENV_EXAMPLE.md` pour la liste complète des variables.

Variables R2 requises :
- `R2_ACCOUNT_ID` ou `R2_ACCOUNT`
- `R2_ACCESS_KEY_ID` ou `R2_ACCESS_KEY`
- `R2_SECRET_ACCESS_KEY` ou `R2_SECRET_KEY`
- `R2_BUCKET_NAME` ou `R2_BUCKET`

### 3. Configuration Cloudflare R2

1. Créez un bucket dans Cloudflare Dashboard
2. Générez des API tokens avec permissions `Object Read & Write`
3. Configurez un custom domain (optionnel) pour les URLs publiques
4. Ajoutez les variables dans Railway

## API Routes

### POST /api/files/upload
Upload un ou plusieurs fichiers (max 10, 50MB chacun)

**Headers:**
```
Authorization: Bearer <token>
Content-Type: multipart/form-data
```

**Body:**
- `files`: fichiers (multipart)
- `folder`: dossier (optionnel, défaut: '/')

**Response:**
```json
{
  "success": true,
  "message": "2 fichier(s) uploadé(s) avec succès",
  "files": [...]
}
```

### GET /api/files
Récupérer tous les fichiers de l'utilisateur

**Query params:**
- `folder`: filtrer par dossier (optionnel)
- `page`: numéro de page (optionnel, défaut: 1)
- `limit`: nombre par page (optionnel, défaut: 50)

**Response:**
```json
{
  "success": true,
  "files": [...],
  "pagination": {
    "page": 1,
    "limit": 50,
    "total": 100,
    "totalPages": 2
  }
}
```

### GET /api/files/:id
Récupérer un fichier spécifique

### DELETE /api/files/:id
Supprimer un fichier (supprime de R2 et de la DB)

## Frontend

### Route
`/mes-fichiers` - Page de gestion des fichiers

### Fonctionnalités
- ✅ Upload drag & drop
- ✅ Upload multiple (max 10 fichiers)
- ✅ Barre de progression
- ✅ Liste des fichiers avec métadonnées
- ✅ Téléchargement direct
- ✅ Suppression de fichiers
- ✅ Gestion des erreurs (413, 403, timeout)

## Sécurité

- ✅ Toutes les routes protégées par JWT middleware
- ✅ Chaque utilisateur ne voit que ses propres fichiers
- ✅ Validation de la taille des fichiers (50MB max)
- ✅ Pas d'exposition de clés R2 côté frontend
- ✅ URLs publiques générées côté backend uniquement

## Gestion des erreurs

- **413**: Fichier trop volumineux (>50MB)
- **400**: Trop de fichiers (>10) ou champ invalide
- **401**: Non authentifié
- **403**: Accès refusé
- **404**: Fichier non trouvé
- **500**: Erreur serveur

## Structure des fichiers sur R2

```
users/
  {userId}/
    {uuid}.{extension}
    {uuid}.{extension}
    ...
```

## Modèle MongoDB

```javascript
{
  originalName: String,
  name: String,
  mimeType: String,
  size: Number,
  r2Key: String (unique),
  url: String,
  user: ObjectId (ref: User),
  folder: String (default: '/'),
  createdAt: Date,
  updatedAt: Date
}
```

## Production Ready ✅

- ✅ Gestion d'erreurs complète
- ✅ Validation des données
- ✅ Logs détaillés
- ✅ Pagination
- ✅ Variables d'environnement sécurisées
- ✅ Compatible Railway
- ✅ Compatible Cloudflare R2

