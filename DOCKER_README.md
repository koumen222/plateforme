# Guide Docker - Backend Plateforme Andromeda

## 🐳 Construction de l'image Docker

### Depuis le répertoire racine du projet

```bash
# Construire l'image depuis le répertoire racine
docker build -f backend/Dockerfile -t plateforme-backend ./backend

# Ou depuis le répertoire backend
cd backend
docker build -t plateforme-backend .
```

### Depuis le répertoire backend

```bash
cd backend
docker build -t plateforme-backend .
```

## 🚀 Exécution du conteneur

### Avec variables d'environnement dans un fichier .env

```bash
docker run -d \
  --name plateforme-backend \
  -p 3000:3000 \
  --env-file backend/.env \
  plateforme-backend
```

### Avec variables d'environnement en ligne de commande

```bash
docker run -d \
  --name plateforme-backend \
  -p 3000:3000 \
  -e NODE_ENV=production \
  -e PORT=3000 \
  -e MONGO_URI=mongodb+srv://... \
  -e JWT_SECRET=your-secret \
  -e OPENAI_API_KEY=sk-... \
  -e FRONTEND_URL=https://... \
  plateforme-backend
```

## 📋 Variables d'environnement requises

Assurez-vous de définir ces variables dans votre fichier `.env` ou via `-e` :

- `MONGO_URI` : URI de connexion MongoDB
- `JWT_SECRET` : Secret pour signer les tokens JWT
- `JWT_EXPIRES_IN` : Durée de validité des tokens (défaut: 7d)
- `OPENAI_API_KEY` : Clé API OpenAI pour le chatbot
- `FRONTEND_URL` : URL du frontend (pour CORS)
- `PORT` : Port d'écoute (défaut: 3000)
- `NODE_ENV` : Environnement (production/development)

## 🔍 Vérification

```bash
# Voir les logs
docker logs plateforme-backend

# Vérifier que le conteneur tourne
docker ps

# Accéder au conteneur
docker exec -it plateforme-backend sh
```

## 🛠️ Dépannage

### Erreur "Could not read package.json"

Assurez-vous que :
1. Le contexte de build Docker pointe vers le répertoire `backend/`
2. Le fichier `package.json` existe dans `backend/`
3. Vous utilisez la commande : `docker build -f backend/Dockerfile -t plateforme-backend ./backend`

### Erreur "ENOENT: no such file or directory"

Vérifiez que tous les fichiers nécessaires sont présents dans le répertoire backend avant la construction.

