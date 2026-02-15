# Safitech E-Commerce

## 🚀 Plateforme E-Commerce moderne avec PWA

### 📱 Fonctionnalités
- **PWA** : Application installable sur mobile
- **Notifications Push** : Système complet de notifications
- **Mode hors ligne** : Fonctionne sans internet
- **Authentification par appareil** : Connexion automatique
- **Marketing avancé** : Campagnes et analytics
- **Gestion des commandes** : Interface complète

### 🛠️ Tech Stack
- **Frontend** : React 18 + Vite + TailwindCSS
- **Backend** : Node.js + Express + MongoDB
- **PWA** : Service Worker + Manifest
- **Mobile** : React Native/Expo

### 📦 Déploiement

#### Frontend (PWA)
```bash
npm run build
# Le build sera dans frontend/dist/
```

#### Backend
```bash
cd backend
npm install
npm start
```

### 🔧 Configuration
- Variables d'environnement dans `backend/.env`
- Configuration PWA dans `frontend/public/manifest.json`
- Service Worker dans `frontend/public/sw.js`

### 📱 Installation PWA
1. Ouvrir le site sur mobile
2. Cliquer sur "Ajouter à l'écran d'accueil"
3. L'icône apparaît comme une vraie application

### 🌐 URL de production
Configurez votre domaine dans les variables d'environnement du backend.
