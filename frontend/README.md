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

**⚠️ OBLIGATOIRE** : Vous devez créer un fichier `.env` dans `frontend/` avec l'URL de votre backend :

```env
# URL du backend API (OBLIGATOIRE)
VITE_API_BASE_URL=https://votre-backend-url.com
```

**Exemples :**
- Production Railway : `VITE_API_BASE_URL=https://plateforme-backend-production-513f.up.railway.app`
- Production HTTPS : `VITE_API_BASE_URL=https://api.safitech.shop`
- Cloudflare Tunnel : `VITE_API_BASE_URL=https://plateforme-backend-xxxxx.trycloudflare.com`
- Développement local : `VITE_API_BASE_URL=http://localhost:3000`

**Note** : Si votre frontend est en HTTPS, votre backend DOIT aussi être en HTTPS pour éviter l'erreur "Mixed Content". Voir `backend/SSL_SETUP_GUIDE.md` pour configurer SSL.

## 📝 Notes

- Le backend doit être hébergé séparément (voir `../backend/README.md`)
- Le chatbot nécessite le backend pour fonctionner
- Les assets (PDFs, etc.) doivent être dans `public/assets/`

