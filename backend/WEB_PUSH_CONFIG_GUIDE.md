# 🔧 Configuration Backend Express pour Web Push

## 📋 Vue d'ensemble

Ce guide explique la configuration du backend Express pour les notifications push web natives utilisant les clés VAPID.

## 📁 Fichier créé : `config/push.js`

Ce fichier contient toute la configuration et les fonctions utilitaires pour gérer les notifications push.

---

## 🔍 Explication ligne par ligne

### **1. Imports et configuration**

```javascript
import webpush from 'web-push';
import dotenv from 'dotenv';
dotenv.config();
```

- **`webpush`** : Bibliothèque principale pour gérer les notifications push côté serveur
- **`dotenv`** : Charge les variables d'environnement depuis le fichier `.env`

---

### **2. Récupération des clés VAPID**

```javascript
const VAPID_PUBLIC_KEY = process.env.VAPID_PUBLIC_KEY;
const VAPID_PRIVATE_KEY = process.env.VAPID_PRIVATE_KEY;
const VAPID_SUBJECT = process.env.VAPID_SUBJECT || 'mailto:contact@example.com';
```

**Explication** :
- Les clés sont récupérées depuis les variables d'environnement
- `VAPID_SUBJECT` a une valeur par défaut si non définie
- Ces valeurs doivent être dans votre fichier `.env`

---

### **3. Validation des clés**

```javascript
const validateVapidKeys = () => {
  if (!VAPID_PUBLIC_KEY) {
    console.warn('⚠️  VAPID_PUBLIC_KEY non défini dans .env');
    return false;
  }
  // ... autres vérifications
};
```

**Pourquoi** :
- Vérifie que toutes les clés sont présentes avant d'utiliser Web Push
- Affiche des warnings clairs si quelque chose manque
- Évite les erreurs silencieuses

---

### **4. Configuration de web-push**

```javascript
webpush.setVapidDetails(
  VAPID_SUBJECT,        // Contact email/URL
  VAPID_PUBLIC_KEY,     // Clé publique
  VAPID_PRIVATE_KEY     // Clé privée
);
```

**Explication** :
- **`setVapidDetails()`** : Configure web-push avec vos clés VAPID
- Cette configuration est **globale** : une fois appelée, toutes les notifications utiliseront ces clés
- **DOIT être appelée avant** d'envoyer des notifications

**Paramètres** :
1. **Subject** : Email ou URL de contact (ex: `mailto:contact@example.com`)
2. **Public Key** : Clé publique VAPID (peut être exposée)
3. **Private Key** : Clé privée VAPID (doit rester secrète)

---

### **5. Fonction `sendPushNotification()`**

```javascript
export const sendPushNotification = async (subscription, payload, options = {}) => {
```

**Paramètres** :

#### **`subscription`** (Object)
Objet d'abonnement push reçu du frontend. Format :
```javascript
{
  endpoint: 'https://fcm.googleapis.com/fcm/send/...',
  keys: {
    p256dh: 'clé_encryption_publique',
    auth: 'clé_auth_secret'
  }
}
```

#### **`payload`** (Object)
Données de la notification :
```javascript
{
  title: 'Titre de la notification',
  body: 'Corps du message',
  icon: '/icon.png',        // Optionnel
  url: '/page-a-ouvrir',    // Optionnel
  data: { ... }             // Données personnalisées
}
```

#### **`options`** (Object, optionnel)
Options d'envoi :
```javascript
{
  TTL: 3600,              // Time To Live en secondes (durée de vie)
  urgency: 'normal',      // 'very-low', 'low', 'normal', 'high'
  headers: {}             // Headers personnalisés
}
```

**Retour** :
```javascript
{
  success: true/false,
  error: 'type_erreur',    // Si échec
  statusCode: 200/410/404  // Code HTTP
}
```

---

### **6. Préparation du payload JSON**

```javascript
const payloadString = JSON.stringify({
  title: payload.title || 'Notification',
  body: payload.body || '',
  icon: payload.icon || '/icon-192x192.png',
  data: {
    url: payload.url || '/',
    ...payload.data
  }
});
```

**Explication** :
- Le payload doit être une **chaîne JSON** (pas un objet)
- Format standardisé pour les notifications web
- `data.url` : URL à ouvrir quand l'utilisateur clique sur la notification

---

### **7. Envoi de la notification**

```javascript
await webpush.sendNotification(subscription, payloadString, sendOptions);
```

**Explication** :
- **`sendNotification()`** : Envoie la notification au service push (FCM, etc.)
- Utilise automatiquement les clés VAPID configurées avec `setVapidDetails()`
- **Asynchrone** : retourne une Promise

---

### **8. Gestion des erreurs**

```javascript
if (error.statusCode === 410) {
  // Abonnement expiré
  return { success: false, error: 'subscription_expired', statusCode: 410 };
}
```

**Codes d'erreur importants** :
- **410 Gone** : Abonnement expiré → Supprimer de la base de données
- **404 Not Found** : Abonnement introuvable → Supprimer de la base de données
- **413 Payload Too Large** : Payload > 4KB → Réduire la taille

---

### **9. Fonction `sendPushNotificationToMany()`**

```javascript
export const sendPushNotificationToMany = async (subscriptions, payload, options = {}) => {
```

**Explication** :
- Envoie une notification à **plusieurs utilisateurs** en parallèle
- Utilise `Promise.allSettled()` pour ne pas échouer si un envoi échoue
- Retourne un résumé : `{ success: 5, failed: 2, errors: [...] }`

**Cas d'usage** :
- Notification à tous les utilisateurs
- Notification à un groupe d'utilisateurs
- Newsletter push

---

## 🚀 Intégration dans le serveur

### **Étape 1 : Ajouter dans `server.js`**

```javascript
import { configureWebPush } from './config/push.js';

// Dans la fonction startServer(), après la connexion MongoDB :
await configureWebPush();
```

### **Étape 2 : Créer une route pour exposer la clé publique**

Créer `routes/push.js` :
```javascript
import express from 'express';
import { getPublicKey } from '../config/push.js';

const router = express.Router();

// GET /api/push/public-key
router.get('/public-key', (req, res) => {
  const publicKey = getPublicKey();
  if (!publicKey) {
    return res.status(500).json({ error: 'Web Push non configuré' });
  }
  res.json({ publicKey });
});

export default router;
```

### **Étape 3 : Monter la route dans `server.js`**

```javascript
import pushRoutes from './routes/push.js';
app.use('/api/push', pushRoutes);
```

---

## 📝 Configuration `.env`

Ajoutez ces lignes dans `backend/.env` :

```env
# Clés VAPID pour Web Push
VAPID_PUBLIC_KEY=BEhWTqXdjYEyLYGHivn0xvYuQ3wZwnp8Y5078A1jIQ02OHtetaj_QyV3RwOaxAcoFuumRC7SqQQNOjIp1Esb3k4
VAPID_PRIVATE_KEY=-dTJxCLze59O15SXUdCaFKFYyu2xRvSTeOm9K_HQq9s
VAPID_SUBJECT=mailto:contact@safitech.shop
```

**Important** :
- Remplacez les clés par celles que vous avez générées
- Remplacez l'email dans `VAPID_SUBJECT` par votre email réel
- Ne commitez **JAMAIS** le fichier `.env` dans Git

---

## ✅ Vérification

Pour tester que la configuration fonctionne :

```javascript
// Dans server.js, après configureWebPush()
console.log('✅ Web Push configuré');
```

Si vous voyez ce message au démarrage du serveur, la configuration est correcte !

---

## 🔐 Sécurité

⚠️ **Règles importantes** :
1. ❌ Ne jamais exposer la clé privée dans le code frontend
2. ✅ La clé publique peut être dans le code frontend
3. ✅ Stocker la clé privée uniquement dans `.env`
4. ✅ Utiliser des variables d'environnement sur Railway pour la production

---

## 📚 Prochaines étapes

1. ✅ Configuration backend (fait)
2. ⏭️ Créer le modèle MongoDB pour stocker les abonnements
3. ⏭️ Créer les routes API pour gérer les abonnements
4. ⏭️ Créer le Service Worker côté frontend
5. ⏭️ Implémenter l'abonnement dans React
