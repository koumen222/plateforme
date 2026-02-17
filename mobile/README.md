# Plateforme Formation E-Commerce - Mobile

Version mobile du module e-commerce développée avec Expo et React Native.

## 🚀 Fonctionnalités E-Commerce

### ✅ Fonctionnalités implémentées

- **Authentification E-Commerce** : Connexion/inscription dédiée au module boutique
- **Gestion des produits** : Liste, détails, recherche, filtrage
- **Panier intelligent** : Ajout, modification, suppression d'articles
- **Gestion multi-devises** : Support EUR, USD, XAF, etc.
- **Navigation optimisée** : Bottom tabs et navigation fluide
- **Thème adaptatif** : Clair/sombre avec design mobile-first
- **Stock en temps réel** : Affichage des disponibilités
- **Images produits** : Gallery avec plusieurs vues
- **Favoris et partage** : Fonctionnalités sociales intégrées

### 📱 Écrans disponibles

1. **Accueil Boutique** (`EcomHomeScreen`)
   - Produits populaires
   - Catégories
   - Commandes récentes
   - Actions rapides

2. **Liste Produits** (`EcomProductsScreen`)
   - Recherche et filtrage
   - Tri par prix/nom/date
   - Affichage en grille
   - Gestion du stock

3. **Détails Produit** (`EcomProductDetailScreen`)
   - Gallery d'images
   - Description complète
   - Sélecteur de quantité
   - Produits similaires

4. **Panier** (`EcomCartScreen`)
   - Gestion des articles
   - Calcul du total
   - Modification des quantités
   - Vidage du panier

## 🛠 Architecture Technique

### Structure des dossiers

```
mobile/src/
├── contexts/
│   ├── AuthContext.js          # Authentification principale
│   ├── ThemeContext.js         # Gestion des thèmes
│   ├── NotificationsContext.js # Notifications push
│   └── ecom/
│       ├── EcomAuthContext.js  # Authentification e-commerce
│       ├── CartContext.js      # Gestion du panier
│       └── CurrencyContext.js  # Gestion multi-devises
├── screens/
│   └── ecom/
│       ├── EcomHomeScreen.js       # Accueil boutique
│       ├── EcomProductsScreen.js   # Liste produits
│       ├── EcomProductDetailScreen.js # Détails produit
│       └── EcomCartScreen.js        # Panier
├── services/
│   └── ecom/
│       └── ecomApi.js          # Services API e-commerce
└── navigation/
    ├── AppNavigator.js         # Navigation principale
    ├── EcomNavigator.js        # Navigation e-commerce
    └── AdminNavigator.js       # Navigation admin
```

### Contextes et Providers

- **EcomAuthProvider** : Gère l'authentification spécifique e-commerce
- **CartProvider** : Gère l'état du panier avec persistance
- **CurrencyProvider** : Gère les conversions de devises
- **ThemeProvider** : Thème clair/sombre partagé

### Services API

L'API e-commerce (`ecomApi.js`) inclut :
- Authentification e-commerce
- Gestion des produits et catégories
- Commandes et transactions
- Clients et prospects
- Rapports et statistiques

## 🎨 Design et UX

### Caractéristiques mobile-first

- **Navigation par onglets** : Accès rapide aux sections principales
- **Cards optimisées** : Design adapté aux écrans mobiles
- **Gestures** : Swipe, pull-to-refresh
- **Images responsives** : Gallery optimisée pour mobile
- **Feedback visuel** : Loading states, animations

### Thème et couleurs

- **Palette cohérente** : Couleurs primaires/secondaires définies
- **Mode sombre** : Support automatique du thème système
- **Contraste optimal** : Accessibilité WCAG

## 🔧 Configuration

### Variables d'environnement

Créer un fichier `.env` à la racine :

```
API_URL=http://localhost:3001
```

### Configuration Expo

Le fichier `app.json` inclut :
- Permissions pour l'accès aux photos
- Configuration iOS/Android
- Splash screen et icônes

## 📦 Installation et Lancement

1. **Installation des dépendances** :
   ```bash
   cd mobile
   npm install
   ```

2. **Lancement en développement** :
   ```bash
   npm start
   ```

3. **Options disponibles** :
   - `a` : Lancer sur Android
   - `i` : Lancer sur iOS
   - `w` : Lancer dans le navigateur
   - `r` : Recharger

## 🔗 Intégration Backend

### Points d'API

L'application mobile utilise les mêmes endpoints que la version web :

- `/api/ecom/auth/*` : Authentification
- `/api/ecom/products/*` : Produits
- `/api/ecom/orders/*` : Commandes
- `/api/ecom/cart/*` : Panier

### Authentification

- Token stocké dans AsyncStorage
- Support des workspaces
- Auto-rafraîchissement des tokens

## 🚀 Déploiement

### Build avec EAS Build

```bash
# Installation EAS CLI
npm install -g eas-cli

# Configuration
eas build:configure

# Build Android
eas build --platform android

# Build iOS
eas build --platform ios
```

### Publication

- **Expo Go** : Développement et tests
- **App Store/Google Play** : Production via EAS Build
- **Mises à jour OTA** : Déploiement sans validation

## 🔄 Synchronisation avec Web

### Partage de code

- **Mêmes endpoints API** : Backend partagé
- **Structure de données** : Compatible avec la version web
- **Authentification** : Tokens compatibles

### Fonctionnalités exclusives mobile

- **Notifications push** : Expo Notifications
- **Camera/Gallery** : Expo Image Picker
- **Stockage local** : AsyncStorage optimisé
- **Gestures** : Navigation tactile

## 🐛 Debugging et Tests

### Outils de développement

- **Expo DevTools** : Inspection des composants
- **Console logs** : Debugging intégré
- **Hot reload** : Mise à jour instantanée
- **Shake gesture** : Menu de développement

### Tests

```bash
# Tests unitaires
npm test

# Linting
npm run lint
```

## 📈 Performance

### Optimisations

- **Lazy loading** : Chargement des écrans à la demande
- **Image caching** : Cache des images produits
- **FlatList** : Optimisation des listes longues
- **AsyncStorage** : Persistance efficace

### Monitoring

- **Analytics** : Expo Analytics (optionnel)
- **Error tracking** : Sentry (optionnel)
- **Performance monitoring** : Expo Metrics

## 🔒 Sécurité

### Bonnes pratiques

- **Tokens sécurisés** : Stockage dans AsyncStorage
- **HTTPS obligatoire** : Communication sécurisée
- **Validation inputs** : Protection contre les injections
- **Rate limiting** : Protection contre les abus

## 🆕 Fonctionnalités futures

- **Checkout complet** : Paiement intégré
- **Wishlist** : Liste de souhaits
- **Reviews** : Avis produits
- **Chat support** : Support client intégré
- **Push notifications** : Notifications de commandes

## 📞 Support

Pour toute question ou problème concernant la version mobile e-commerce :

1. **Documentation** : Consulter ce README
2. **Issues** : Signaler les problèmes sur GitHub
3. **Support technique** : Contacter l'équipe de développement

---

**Développé avec ❤️ pour une expérience mobile optimale**
