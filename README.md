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

- HTML5
- CSS3 (design moderne avec animations)
- JavaScript vanilla
- Node.js/Express pour le backend (chatbot)
- OpenAI API pour le chatbot

## 📁 Structure des fichiers

```
/plateforme
 ├── index.html          (JOUR 1)
 ├── lesson1.html        (JOUR 2)
 ├── lesson2.html        (JOUR 3)
 ├── lesson4.html        (JOUR 4)
 ├── lesson5.html        (JOUR 5)
 ├── lesson6.html        (JOUR 6)
 ├── lesson7.html        (JOUR 7)
 ├── lesson8.html        (JOUR 8)
 ├── css/
 │   └── style.css       (Styles principaux)
 ├── js/
 │   ├── app.js          (JavaScript principal)
 │   └── chatbot.js      (Chatbot OpenAI)
 ├── backend/
 │   ├── server.js       (Serveur backend Express)
 │   ├── package.json    (Dépendances Node.js backend)
 │   └── .env            (Variables d'environnement)
 └── assets/
     └── docs/           (Ressources téléchargeables)
```

## 🌿 Branches

- **main** : Branche de développement
- **prod** : Branche de production (déploiement en ligne)

## 🔧 Installation et utilisation

### Option 1 : Utilisation simple (sans chatbot)

Ouvrez simplement `index.html` dans un navigateur web pour commencer la formation.

### Option 2 : Avec chatbot OpenAI (recommandé)

1. **Installer Node.js** (si ce n'est pas déjà fait)
   - Téléchargez depuis https://nodejs.org/

2. **Installer les dépendances du backend**
   ```bash
   cd backend
   npm install
   ```

3. **Configurer la clé API OpenAI**
   - Créez un fichier `.env` dans le dossier `backend/`
   - Ajoutez : `OPENAI_API_KEY=votre_cle_api_ici`
   - Ou modifiez directement dans `backend/server.js` (ligne 23)

4. **Démarrer le serveur**
   ```bash
   cd backend
   npm start
   ```

5. **Ouvrir dans le navigateur**
   - Allez sur `http://localhost:3000`

## 🚀 Hébergement

### Frontend et Backend séparés (recommandé pour la production)

Le frontend (fichiers HTML/CSS/JS) et le backend (API Node.js) peuvent être hébergés séparément.

#### Hébergement du Frontend

Le frontend peut être hébergé sur n'importe quel service de fichiers statiques :
- **Netlify** : Glissez-déposez le dossier ou connectez votre repo GitHub
- **Vercel** : Connectez votre repo GitHub
- **GitHub Pages** : Activez Pages dans les paramètres de votre repo
- **Serveur web classique** (Apache, Nginx) : Déployez les fichiers HTML/CSS/JS

#### Hébergement du Backend

Voir `backend/README.md` pour les instructions complètes d'hébergement du backend.

**Options populaires :**
- Heroku
- Railway
- Render
- VPS (DigitalOcean, AWS, etc.)

#### Configuration après déploiement

1. Déployez le backend et notez son URL (ex: `https://votre-backend.herokuapp.com`)
2. Dans le frontend, modifiez `js/config.js` :
   ```javascript
   BACKEND_URL: 'https://votre-backend.herokuapp.com'
   ```
3. Ou ajoutez dans vos fichiers HTML (avant `config.js`) :
   ```html
   <script>
     window.CONFIG_BACKEND_URL = 'https://votre-backend.herokuapp.com';
   </script>
   ```

## 📝 Notes importantes

- Le chatbot nécessite un serveur backend pour fonctionner (problème CORS)
- La clé API OpenAI doit être configurée dans `backend/.env`
- Pour la production, hébergez le backend et le frontend séparément pour de meilleures performances
- Voir `backend/README.md` pour plus de détails sur le backend et son hébergement
