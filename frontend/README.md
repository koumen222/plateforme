# Frontend React - Formation Andromeda

Application React pour la plateforme de formation Facebook Ads - Méthode Andromeda.

## 🚀 Technologies

- **React 18** - Bibliothèque UI
- **React Router** - Navigation
- **Vite** - Build tool ultra-rapide
- **CSS Modules** - Styles

## 📁 Structure

```
frontend/
├── src/
│   ├── components/      # Composants réutilisables
│   │   ├── Layout.jsx
│   │   ├── Sidebar.jsx
│   │   ├── VideoPlayer.jsx
│   │   └── Chatbot.jsx
│   ├── pages/           # Pages/leçons
│   │   ├── LessonPage.jsx
│   │   └── CoachingPage.jsx
│   ├── data/            # Données
│   │   └── lessons.js
│   ├── config/          # Configuration
│   │   └── config.js
│   ├── styles/          # Styles CSS
│   │   └── style.css
│   ├── App.jsx          # Application principale
│   └── main.jsx         # Point d'entrée
├── index.html
├── package.json
├── vite.config.js
└── README.md
```

## 🔧 Installation

```bash
cd frontend
npm install
```

## 🏃 Développement

```bash
npm run dev
```

L'application sera accessible sur `http://localhost:5173`

## 🏗️ Build Production

```bash
npm run build
```

Les fichiers optimisés seront générés dans le dossier `dist/`

## 🌐 Déploiement

### Vercel (Recommandé)

1. Connectez votre repository GitHub
2. Configurez le dossier racine sur `frontend/`
3. Build command: `npm run build`
4. Output directory: `dist`
5. Deploy!

### Netlify

1. Connectez votre repository
2. Base directory: `frontend`
3. Build command: `npm run build`
4. Publish directory: `frontend/dist`

## ⚙️ Configuration

### Backend URL

Pour configurer l'URL du backend, créez un fichier `.env` dans `frontend/`:

```env
# Développement local
VITE_BACKEND_URL=http://localhost:3000

# Production
# VITE_BACKEND_URL=https://votre-backend.onrender.com
```

**Note** : En développement, le backend URL pointe automatiquement vers `http://localhost:3000` si vous êtes sur `localhost`. Pour la production, définissez `VITE_BACKEND_URL` dans votre `.env`.

### Démarrage du Backend

Avant de lancer le frontend, assurez-vous que le backend est démarré :

```bash
cd ../backend
npm install
npm start
```

Le backend doit tourner sur `http://localhost:3000`.

## 📝 Notes

- Le backend doit être hébergé séparément (voir `../backend/README.md`)
- Le chatbot nécessite le backend pour fonctionner
- Les assets (PDFs, etc.) doivent être dans `public/assets/`

