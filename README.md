# Formation Andromeda - Mini LMS

Plateforme de formation e-learning sur Facebook Ads utilisant la méthode Andromeda.

## 📚 Structure

- **JOUR 1** : Introduction
- **JOUR 2** : La structure de campagne
- **JOUR 3** : Créer la créative Andromeda
- **JOUR 4** : Paramétrer le compte publicitaire
- **JOUR 5** : Lancement
- **JOUR 6** : Analyse et optimisation
- **JOUR 7** : Mini Scaling
- **JOUR 8** : Réservation Coaching

## 🎨 Caractéristiques

- Design futuriste avec thème africain (couleurs dorées/orange)
- Design responsive optimisé mobile
- Glassmorphism et effets néons
- Vidéos YouTube et Vimeo intégrées
- Navigation fluide entre les leçons
- Sidebar interactive avec mise en évidence de la leçon active
- Chatbot OpenAI intégré
- Formulaire de réservation de coaching avec WhatsApp

## 🚀 Technologies

### Frontend
- **React 18** - Bibliothèque UI moderne
- **React Router** - Navigation SPA
- **Vite** - Build tool ultra-rapide
- **CSS3** - Design moderne avec animations

### Backend
- **Node.js/Express** - Serveur API
- **OpenAI API** - Chatbot intelligent

## 📁 Structure des fichiers

```
/plateforme
 ├── frontend/              # Application React
 │   ├── src/
 │   │   ├── components/    # Composants React
 │   │   ├── pages/         # Pages/leçons
 │   │   ├── data/          # Données des leçons
 │   │   ├── config/        # Configuration
 │   │   └── styles/        # Styles CSS
 │   ├── package.json
 │   ├── vite.config.js
 │   └── index.html
 ├── backend/               # API Backend
 │   ├── server.js
 │   ├── package.json
 │   └── .env
 └── assets/
     └── docs/              # Ressources téléchargeables
```

## 🌿 Branches

- **main** : Branche de développement
- **prod** : Branche de production (déploiement en ligne)

## 🔧 Installation et utilisation

### Développement Local

#### 1. Backend

```bash
cd backend
npm install
```

Créez un fichier `.env` :
```env
OPENAI_API_KEY=votre_cle_api_openai
PORT=3000
```

Démarrez le backend :
```bash
npm start
```

#### 2. Frontend

```bash
cd frontend
npm install
```

Créez un fichier `.env` (optionnel) :
```env
VITE_BACKEND_URL=http://localhost:3000
```

Démarrez le frontend :
```bash
npm run dev
```

Accédez à `http://localhost:5173`

### Build Production

```bash
cd frontend
npm run build
```

Les fichiers optimisés seront dans `frontend/dist/`

## 🚀 Hébergement

### Frontend (Vercel/Netlify)

Le frontend peut être hébergé sur :
- **Vercel** (recommandé) - Connectez votre repo, dossier racine: `frontend/`
- **Netlify** - Base directory: `frontend/`
- **GitHub Pages** - Après build, déployez `dist/`

### Backend (Render/Heroku)

Le backend doit être hébergé séparément :
- **Render** - Voir `backend/README.md`
- **Heroku** - Voir `backend/README.md`
- **Railway** - Voir `backend/README.md`

### Configuration après déploiement

1. Déployez le backend et notez son URL (ex: `https://votre-backend.onrender.com`)
2. Dans le frontend, créez `.env.production` ou modifiez `src/config/config.js` :
   ```javascript
   VITE_BACKEND_URL=https://votre-backend.onrender.com
   ```
3. Rebuild et redéployez le frontend

## 📝 Notes importantes

- Le chatbot nécessite un serveur backend pour fonctionner (problème CORS)
- La clé API OpenAI doit être configurée dans `backend/.env`
- Pour la production, hébergez le backend et le frontend séparément pour de meilleures performances
- Voir `frontend/README.md` pour plus de détails sur le frontend
- Voir `backend/README.md` pour plus de détails sur le backend
