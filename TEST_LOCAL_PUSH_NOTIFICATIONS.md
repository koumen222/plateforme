# 🧪 Guide de Test Local - Notifications Push

## 📋 Prérequis

Avant de commencer, assurez-vous d'avoir :

- ✅ Node.js installé (v18+)
- ✅ MongoDB en cours d'exécution (local ou Atlas)
- ✅ Variables VAPID configurées dans `backend/.env`
- ✅ Un compte utilisateur avec `status: 'active'`

---

## 🚀 Étape 1 : Configuration

### 1.1 Vérifier les variables VAPID

Ouvrez `backend/.env` et vérifiez que ces lignes sont présentes :

```env
VAPID_PUBLIC_KEY=BEhWTqXdjYEyLYGHivn0xvYuQ3wZwnp8Y5078A1jIQ02OHtetaj_QyV3RwOaxAcoFuumRC7SqQQNOjIp1Esb3k4
VAPID_PRIVATE_KEY=-dTJxCLze59O15SXUdCaFKFYyu2xRvSTeOm9K_HQq9s
VAPID_SUBJECT=mailto:contact@safitech.shop
```

**Si les clés ne sont pas présentes**, générez-les :

```bash
cd backend
npx web-push generate-vapid-keys
```

Copiez les clés générées dans votre `.env`.

---

## 🚀 Étape 2 : Démarrer les serveurs

### 2.1 Démarrer le backend

```bash
cd backend
npm install  # Si pas encore fait
npm start
```

**Vérifications** :
- ✅ Le serveur démarre sur le port 3000 (ou celui configuré)
- ✅ Vous voyez dans les logs : `✅ Web Push configuré avec succès`
- ✅ Vous voyez : `✅ Routes Web Push chargées`

**Exemple de logs attendus** :
```
✅ Web Push configuré avec succès
   - Subject: mailto:contact@safitech.shop
   - Public Key: BEhWTqXdjYEyLYGHivn0xvYuQ3wZwnp8Y5078A1jIQ02OHtetaj_QyV3RwOaxAcoFuumRC7SqQQNOjIp1Esb3k4...
   - Private Key: -dTJxCLze59O15SXUdCaFKFYyu2xRvSTeOm9K_HQq9s... (masquée)
✅ Routes Web Push chargées
   Route public-key: GET /api/push/public-key
🚀 Backend running on port 3000
```

### 2.2 Démarrer le frontend

Dans un **nouveau terminal** :

```bash
cd frontend
npm install  # Si pas encore fait
npm run dev
```

**Vérifications** :
- ✅ Le serveur démarre sur `http://localhost:5173`
- ✅ Ouvrez la console du navigateur (F12)
- ✅ Vous voyez : `✅ Service Worker enregistré: /`

---

## 🧪 Étape 3 : Tests de base

### 3.1 Test 1 : Vérifier la route API publique

Ouvrez votre navigateur et allez sur :

```
http://localhost:3000/api/push/public-key
```

**Résultat attendu** :
```json
{
  "publicKey": "BEhWTqXdjYEyLYGHivn0xvYuQ3wZwnp8Y5078A1jIQ02OHtetaj_QyV3RwOaxAcoFuumRC7SqQQNOjIp1Esb3k4",
  "subject": "mailto:contact@safitech.shop"
}
```

**Si erreur** :
- Vérifiez que le backend est démarré
- Vérifiez que les variables VAPID sont dans `.env`
- Vérifiez les logs du backend

---

### 3.2 Test 2 : Vérifier le Service Worker

1. Ouvrez `http://localhost:5173` dans Chrome/Firefox
2. Ouvrez les DevTools (F12)
3. Allez dans l'onglet **Application** (Chrome) ou **Stockage** (Firefox)
4. Dans le menu de gauche, cliquez sur **Service Workers**

**Vérifications** :
- ✅ Vous voyez un Service Worker actif avec l'URL `/sw.js`
- ✅ Le statut est "activated and is running"

**Si le Service Worker n'apparaît pas** :
- Vérifiez la console pour les erreurs
- Vérifiez que `public/sw.js` existe
- Rechargez la page (Ctrl+R ou Cmd+R)

---

### 3.3 Test 3 : Vérifier le support des notifications

Dans la console du navigateur (F12), tapez :

```javascript
console.log('Service Worker:', 'serviceWorker' in navigator);
console.log('Push Manager:', 'PushManager' in window);
console.log('Notifications:', 'Notification' in window);
console.log('Permission:', Notification.permission);
```

**Résultat attendu** :
```
Service Worker: true
Push Manager: true
Notifications: true
Permission: default (ou granted/denied)
```

**Si `false`** :
- Utilisez Chrome, Firefox ou Edge (pas Safari < 16.4)
- Vérifiez que vous êtes sur `localhost` ou `https://`

---

## 🧪 Étape 4 : Test d'abonnement

### 4.1 Se connecter

1. Allez sur `http://localhost:5173`
2. Connectez-vous avec un compte ayant `status: 'active'`
3. Vérifiez que vous êtes bien connecté

### 4.2 Activer les notifications

1. **Cherchez le bouton de notifications push** dans le Header
   - Desktop : À côté du bouton de thème
   - Mobile : Dans la barre d'actions en haut

2. **Cliquez sur le bouton**
   - Le navigateur demande la permission
   - Cliquez sur **Autoriser** ou **Allow**

3. **Vérifiez dans la console** :
   ```
   ✅ Service Worker enregistré: /
   ✅ Abonnement push créé: https://fcm.googleapis.com/fcm/send/...
   ✅ Abonnement enregistré sur le backend: {...}
   ```

4. **Vérifiez visuellement** :
   - Le bouton devient bleu avec l'icône cloche (FiBell)
   - Un tooltip apparaît : "Notifications activées !"

---

### 4.3 Vérifier l'abonnement dans le backend

Dans la console du navigateur, testez :

```javascript
// Vérifier l'abonnement actuel
navigator.serviceWorker.ready.then(async registration => {
  const subscription = await registration.pushManager.getSubscription();
  console.log('Abonnement actuel:', subscription);
  
  if (subscription) {
    console.log('Endpoint:', subscription.endpoint);
    console.log('Keys:', {
      p256dh: subscription.getKey('p256dh') ? 'Présente' : 'Manquante',
      auth: subscription.getKey('auth') ? 'Présente' : 'Manquante'
    });
  } else {
    console.log('Aucun abonnement trouvé');
  }
});
```

**Résultat attendu** :
- Un objet `PushSubscription` avec `endpoint` et `keys`

---

### 4.4 Vérifier l'abonnement dans MongoDB

Ouvrez MongoDB Compass ou votre client MongoDB et vérifiez :

```javascript
// Collection: pushsubscriptions
db.pushsubscriptions.find({ userId: ObjectId("VOTRE_USER_ID") })
```

**Vérifications** :
- ✅ Un document existe avec votre `userId`
- ✅ `endpoint` contient l'URL FCM
- ✅ `p256dh` et `auth` sont présents
- ✅ `isActive` est `true`

---

## 🧪 Étape 5 : Test d'envoi de notification

### 5.1 Test manuel depuis la console

Dans la console du navigateur :

```javascript
navigator.serviceWorker.ready.then(registration => {
  registration.showNotification('Test de notification', {
    body: 'Ceci est une notification de test depuis la console',
    icon: '/img/logo.svg',
    badge: '/img/logo.svg',
    tag: 'test-notification',
    data: {
      url: '/',
      timestamp: Date.now()
    },
    actions: [
      { action: 'open', title: 'Ouvrir' },
      { action: 'close', title: 'Fermer' }
    ]
  });
});
```

**Résultat attendu** :
- ✅ Une notification apparaît dans le coin de l'écran
- ✅ Vous pouvez cliquer dessus pour ouvrir la page

---

### 5.2 Test depuis le backend (recommandé)

Créez un fichier de test : `backend/scripts/test-push-notification.js`

```javascript
import dotenv from 'dotenv';
import { connectDB } from '../config/database.js';
import { configureWebPush, sendPushNotification } from '../config/push.js';
import PushSubscription from '../models/PushSubscription.js';
import User from '../models/User.js';

dotenv.config();

async function testPushNotification() {
  try {
    // 1. Connexion MongoDB
    await connectDB();
    console.log('✅ MongoDB connecté');

    // 2. Configuration Web Push
    configureWebPush();
    console.log('✅ Web Push configuré');

    // 3. Trouver un utilisateur avec un abonnement actif
    const user = await User.findOne({ status: 'active' });
    if (!user) {
      console.error('❌ Aucun utilisateur actif trouvé');
      process.exit(1);
    }

    console.log(`📧 Test avec l'utilisateur: ${user.email}`);

    // 4. Récupérer les abonnements actifs
    const subscriptions = await PushSubscription.findActiveByUserId(user._id);
    
    if (subscriptions.length === 0) {
      console.error('❌ Aucun abonnement actif trouvé pour cet utilisateur');
      console.log('💡 Connectez-vous sur le frontend et activez les notifications');
      process.exit(1);
    }

    console.log(`✅ ${subscriptions.length} abonnement(s) trouvé(s)`);

    // 5. Envoyer une notification de test
    for (const sub of subscriptions) {
      console.log(`📤 Envoi à l'endpoint: ${sub.endpoint.substring(0, 50)}...`);
      
      const result = await sendPushNotification(sub.toPushSubscription(), {
        title: 'Test de notification push',
        body: `Bonjour ${user.name || user.email}, ceci est une notification de test !`,
        icon: '/img/logo.svg',
        badge: '/img/logo.svg',
        url: '/',
        tag: 'test-notification'
      });

      if (result.success) {
        console.log('✅ Notification envoyée avec succès');
      } else {
        console.error('❌ Erreur:', result.error);
        if (result.statusCode === 410) {
          console.log('⚠️  Abonnement expiré, suppression...');
          await PushSubscription.deleteOne({ _id: sub._id });
        }
      }
    }

    console.log('✅ Test terminé');
    process.exit(0);
  } catch (error) {
    console.error('❌ Erreur:', error);
    process.exit(1);
  }
}

testPushNotification();
```

**Exécuter le test** :

```bash
cd backend
node scripts/test-push-notification.js
```

**Résultat attendu** :
- ✅ La notification apparaît dans le navigateur
- ✅ Même si l'onglet n'est pas ouvert !

---

## 🧪 Étape 6 : Test de désabonnement

### 6.1 Désabonner depuis l'interface

1. Cliquez à nouveau sur le bouton de notifications push
2. Le bouton redevient gris avec l'icône barrée
3. Vérifiez dans la console : `✅ Désabonnement réussi`

### 6.2 Vérifier dans MongoDB

```javascript
db.pushsubscriptions.find({ userId: ObjectId("VOTRE_USER_ID") })
```

**Résultat attendu** :
- ✅ Le document est supprimé (ou `isActive: false`)

---

## 🔍 Débogage

### Problème : Service Worker ne s'enregistre pas

**Solutions** :
1. Vérifiez que vous êtes sur `localhost` ou `https://`
2. Vérifiez la console pour les erreurs
3. Vérifiez que `public/sw.js` existe
4. Videz le cache du navigateur (Ctrl+Shift+Delete)
5. Désenregistrez les anciens Service Workers :
   ```javascript
   navigator.serviceWorker.getRegistrations().then(registrations => {
     registrations.forEach(reg => reg.unregister());
   });
   ```

### Problème : Le bouton n'apparaît pas

**Vérifications** :
1. Êtes-vous connecté ? (`isAuthenticated === true`)
2. Votre compte est-il actif ? (`user.status === 'active'`)
3. Les notifications sont-elles supportées ? (Chrome/Firefox/Edge)
4. Vérifiez la console pour les erreurs

### Problème : Erreur "Web Push non configuré"

**Solutions** :
1. Vérifiez que les variables VAPID sont dans `backend/.env`
2. Redémarrez le backend
3. Vérifiez les logs au démarrage

### Problème : Erreur "Permission refusée"

**Solutions** :
1. Allez dans les paramètres du navigateur
2. Recherchez "Notifications"
3. Autorisez les notifications pour `localhost`
4. Rechargez la page

### Problème : Notification ne s'affiche pas

**Vérifications** :
1. La permission est-elle accordée ? (`Notification.permission === 'granted'`)
2. L'abonnement existe-t-il ? (vérifier dans MongoDB)
3. Le Service Worker est-il actif ?
4. Vérifiez les logs du Service Worker dans la console

---

## 📊 Checklist de test complète

- [ ] Backend démarre sans erreur
- [ ] Route `/api/push/public-key` fonctionne
- [ ] Service Worker s'enregistre
- [ ] Support des notifications vérifié
- [ ] Connexion utilisateur réussie
- [ ] Bouton de notifications visible
- [ ] Abonnement créé avec succès
- [ ] Abonnement visible dans MongoDB
- [ ] Notification de test affichée (console)
- [ ] Notification envoyée depuis le backend
- [ ] Clic sur notification fonctionne
- [ ] Désabonnement fonctionne
- [ ] Abonnement supprimé de MongoDB

---

## 🎯 Tests avancés

### Test avec plusieurs appareils

1. Ouvrez le site dans **Chrome** et abonnez-vous
2. Ouvrez le site dans **Firefox** (même compte) et abonnez-vous
3. Vérifiez dans MongoDB : vous devriez avoir 2 abonnements
4. Envoyez une notification depuis le backend
5. **Résultat** : Les deux navigateurs reçoivent la notification

### Test de limite (5 appareils)

1. Abonnez-vous avec 5 appareils différents
2. Essayez de vous abonner avec un 6ème
3. **Résultat attendu** : Erreur "Limite atteinte"

### Test avec onglet fermé

1. Abonnez-vous aux notifications
2. **Fermez complètement le navigateur**
3. Envoyez une notification depuis le backend
4. **Résultat** : La notification apparaît quand même (si le navigateur est démarré)

---

## 📝 Notes importantes

1. **HTTPS requis en production** : Les Service Workers nécessitent HTTPS (sauf localhost)
2. **Permission nécessaire** : L'utilisateur doit autoriser les notifications
3. **Limite de 5 appareils** : Un utilisateur peut avoir max 5 abonnements actifs
4. **Notifications même hors ligne** : Les notifications fonctionnent même si l'utilisateur n'est pas sur le site

---

## 🆘 Besoin d'aide ?

Si vous rencontrez des problèmes :

1. Vérifiez les logs du backend
2. Vérifiez la console du navigateur
3. Vérifiez les DevTools > Application > Service Workers
4. Vérifiez MongoDB pour les abonnements
5. Consultez la documentation dans les fichiers `.md`

---

## ✅ Résultat attendu

Si tous les tests passent, vous devriez :

- ✅ Voir le bouton de notifications dans le Header
- ✅ Pouvoir activer/désactiver les notifications
- ✅ Recevoir des notifications même si l'onglet est fermé
- ✅ Voir les abonnements dans MongoDB
- ✅ Pouvoir envoyer des notifications depuis le backend

**Félicitations ! Le système fonctionne ! 🎉**
