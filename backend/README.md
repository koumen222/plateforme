# Backend - Plateforme de Formation Andromeda

## Description

Serveur backend Node.js/Express pour gérer les appels API OpenAI et résoudre les problèmes CORS. Le backend peut être hébergé séparément du frontend.

## Installation

```bash
cd backend
npm install
```

## Configuration

Créez un fichier `.env` à la racine du dossier `backend/` avec votre clé API OpenAI :

```env
OPENAI_API_KEY=votre_cle_api_openai_ici
PORT=3000
FRONTEND_URL=https://votre-frontend.com  # Optionnel : pour configurer CORS
```

## Démarrage en développement

```bash
npm start
```

Le serveur démarre sur `http://localhost:3000` par défaut.

## Hébergement en production

Le backend est conçu pour être hébergé séparément du frontend. Voici les options d'hébergement populaires :

### Option 1 : Heroku

1. Créez un compte sur [Heroku](https://www.heroku.com/)
2. Installez [Heroku CLI](https://devcenter.heroku.com/articles/heroku-cli)
3. Dans le dossier `backend/`, créez un `Procfile` :
   ```
   web: node server.js
   ```
4. Configurez les variables d'environnement sur Heroku :
   ```bash
   heroku config:set OPENAI_API_KEY=votre_cle_api
   heroku config:set PORT=3000
   ```
5. Déployez :
   ```bash
   git init
   heroku git:remote -a votre-app-backend
   git add .
   git commit -m "Initial commit"
   git push heroku main
   ```

### Option 2 : Railway

1. Créez un compte sur [Railway](https://railway.app/)
2. Connectez votre dépôt GitHub
3. Sélectionnez le dossier `backend/` comme racine
4. Configurez les variables d'environnement dans le tableau de bord Railway

### Option 3 : Render

1. Créez un compte sur [Render](https://render.com/)
2. Créez un nouveau "Web Service"
3. Connectez votre dépôt GitHub
4. Définissez le répertoire racine sur `backend/`
5. Configurez les variables d'environnement dans le tableau de bord

### Option 4 : VPS (DigitalOcean, AWS, etc.)

```bash
# Sur votre serveur
git clone votre-repo
cd backend
npm install
# Configurez .env
npm start
# Ou utilisez PM2 pour la gestion des processus :
npm install -g pm2
pm2 start server.js --name backend
pm2 save
pm2 startup
```

## Configuration CORS

Le backend accepte les requêtes depuis n'importe quelle origine par défaut. Pour la production, configurez `FRONTEND_URL` dans `.env` pour restreindre les origines autorisées.

## Structure

- `server.js` - Serveur Express principal
- `package.json` - Dépendances et scripts
- `.env` - Variables d'environnement (non versionné, créez-le vous-même)

## API Endpoints

### GET /health

Vérifie que le serveur fonctionne.

**Response:**
```json
{
  "status": "ok",
  "message": "Backend API is running"
}
```

### POST /api/chat

Endpoint pour les requêtes du chatbot.

**Body:**
```json
{
  "message": "Votre message",
  "conversationHistory": [...]
}
```

**Response:**
```json
{
  "choices": [{
    "message": {
      "content": "Réponse du chatbot"
    }
  }]
}
```

## Configuration du frontend

Après avoir déployé le backend, mettez à jour `js/config.js` dans le frontend avec l'URL de votre backend :

```javascript
BACKEND_URL: 'https://votre-backend.herokuapp.com'
```

Ou définissez `window.CONFIG_BACKEND_URL` avant le chargement de `config.js` :

```html
<script>
  window.CONFIG_BACKEND_URL = 'https://votre-backend.herokuapp.com';
</script>
<script src="js/config.js"></script>
```
