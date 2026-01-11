# Variables d'environnement requises

Créez un fichier `.env` à la racine du dossier `backend/` avec les variables suivantes :

```env
# MongoDB
MONGO_URI=mongodb://localhost:27017/plateforme-formation

# JWT
JWT_SECRET=your-secret-key-change-in-production
JWT_EXPIRES_IN=7d

# Google OAuth (déjà configuré par défaut, peut être surchargé)
GOOGLE_CLIENT_ID=1001981040159-an283jv5dfi5c94g0dkj5agdujn3rs34.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=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

# OpenAI API (pour le chatbot)
OPENAI_API_KEY=votre_cle_api_openai_ici

# Frontend URL (pour CORS)
FRONTEND_URL=http://localhost:5173
PORT=3000

# Backend URL (pour les redirections et URLs complètes)
BACKEND_URL=http://localhost:3000

# API LYGOS (Paiement Mobile Money)
LYGOS_API_KEY=sk_live_xxxxxxxxx
LYGOS_BASE_URL=https://api.lygosapp.com/v1

# Cloudinary (pour le stockage des fichiers PDF et images)
# Obtenez ces valeurs depuis https://cloudinary.com/console
CLOUDINARY_CLOUD_NAME=votre_cloud_name
CLOUDINARY_API_KEY=votre_api_key
CLOUDINARY_API_SECRET=votre_api_secret
```

## Important

1. **Le fichier `.env` doit être à la racine du dossier `backend/`**
2. **`dotenv.config()` est appelé automatiquement** au début de `server.js` et `cloudinary.js`
3. **Ne commitez jamais le fichier `.env`** (il est dans `.gitignore`)

## Configuration Cloudinary

Pour obtenir vos identifiants Cloudinary :

1. Allez sur [cloudinary.com](https://cloudinary.com)
2. Créez un compte gratuit (25 GB gratuit)
3. Dans le Dashboard, copiez :
   - Cloud Name
   - API Key
   - API Secret

## Pour Railway/Render

Ajoutez ces variables dans les paramètres de votre service :
- `CLOUDINARY_CLOUD_NAME`
- `CLOUDINARY_API_KEY`
- `CLOUDINARY_API_SECRET`

