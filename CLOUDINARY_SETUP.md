# Configuration Cloudinary pour le stockage des fichiers PDF

## Pourquoi Cloudinary ?

Cloudinary permet de stocker les fichiers PDF et images en ligne, évitant ainsi la perte de fichiers lors des redéploiements ou dans les environnements Docker/Railway.

## Configuration

### 1. Créer un compte Cloudinary

1. Allez sur [cloudinary.com](https://cloudinary.com)
2. Créez un compte gratuit (25 GB de stockage gratuit)
3. Une fois connecté, allez dans le Dashboard
4. Notez vos identifiants :
   - Cloud Name
   - API Key
   - API Secret

### 2. Configurer les variables d'environnement

Ajoutez ces variables dans votre fichier `.env` du backend :

```env
CLOUDINARY_CLOUD_NAME=votre_cloud_name
CLOUDINARY_API_KEY=votre_api_key
CLOUDINARY_API_SECRET=votre_api_secret
```

### 3. Pour Railway/Render

Ajoutez ces variables dans les paramètres de votre service :
- `CLOUDINARY_CLOUD_NAME`
- `CLOUDINARY_API_KEY`
- `CLOUDINARY_API_SECRET`

## Utilisation

### Upload via l'API

Lors de la création ou mise à jour d'une ressource PDF, vous pouvez :

1. **Uploader un fichier directement** : Envoyez le fichier PDF dans le champ `pdf` du formulaire multipart/form-data
2. **Utiliser une URL Cloudinary existante** : Fournissez directement l'URL dans le champ `pdfUrl`

### Route d'upload dédiée

```
POST /api/ressources-pdf/upload
Content-Type: multipart/form-data

Fields:
- pdf: fichier PDF (optionnel)
- coverImage: image de couverture (optionnel)
```

Réponse :
```json
{
  "success": true,
  "pdfUrl": "https://res.cloudinary.com/.../plateforme/pdf/...",
  "coverImage": "https://res.cloudinary.com/.../plateforme/covers/..."
}
```

## Avantages

- ✅ Fichiers stockés en ligne, jamais perdus
- ✅ CDN intégré pour des téléchargements rapides
- ✅ 25 GB gratuits
- ✅ Transformation d'images automatique
- ✅ URLs sécurisées (HTTPS)

## Migration des fichiers existants

Pour migrer les fichiers existants vers Cloudinary, vous pouvez créer un script de migration qui :
1. Lit les fichiers depuis `/uploads/pdf/`
2. Les upload vers Cloudinary
3. Met à jour les URLs dans la base de données

