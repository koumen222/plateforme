# 📊 Schéma MongoDB pour les Abonnements Push

## 📋 Modèle : `PushSubscription`

### Fichier : `backend/models/PushSubscription.js`

---

## 🔍 Structure du schéma

### Champs obligatoires (requis)

| Champ | Type | Description | Validation |
|-------|------|-------------|------------|
| `userId` | ObjectId | Référence vers l'utilisateur | Requis, indexé |
| `endpoint` | String | URL unique du service push | Requis, unique, indexé |
| `p256dh` | String | Clé publique de chiffrement | Requis |
| `auth` | String | Clé d'authentification | Requis |

### Champs optionnels

| Champ | Type | Description | Défaut |
|-------|------|-------------|--------|
| `deviceInfo` | String | Info sur l'appareil/navigateur | `null` |
| `userAgent` | String | User-Agent du navigateur | `null` |
| `isActive` | Boolean | Statut de l'abonnement | `true` |
| `lastUsedAt` | Date | Date de dernière utilisation | `Date.now()` |

### Champs automatiques (gérés par Mongoose)

| Champ | Type | Description |
|-------|------|-------------|
| `_id` | ObjectId | ID unique MongoDB (généré automatiquement) |
| `createdAt` | Date | Date de création (géré par `timestamps: true`) |
| `updatedAt` | Date | Date de modification (géré par `timestamps: true`) |

---

## 📐 Exemple de document

```javascript
{
  _id: ObjectId("507f1f77bcf86cd799439011"),
  userId: ObjectId("507f191e810c19729de860ea"),
  endpoint: "https://fcm.googleapis.com/fcm/send/dGhpcyBpcyBhIGZha2UgdG9rZW4...",
  p256dh: "BEl62iUYgUivxIkv69yViEuiBIa40HI9F7D8jW8nN3xrKSHsX2XgLf1yNwcK7NAl2_LhZ2QpYwwpuFoUViXtE",
  auth: "8BW3X4pKJmZwfq5oFWVY7KkZ8j3N2mP5qR7tY9uV1wX2yZ4aB6cD8eF0gH2iJ4kL6mN8oP0qR2sT4uV6wX8yZ",
  deviceInfo: "Chrome on Windows",
  userAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36...",
  isActive: true,
  lastUsedAt: ISODate("2026-01-26T10:30:00.000Z"),
  createdAt: ISODate("2026-01-26T09:00:00.000Z"),
  updatedAt: ISODate("2026-01-26T10:30:00.000Z")
}
```

---

## 🔑 Index MongoDB

### Index simples
- `userId` : Recherche rapide par utilisateur
- `endpoint` : Recherche rapide par endpoint (unique)
- `isActive` : Filtrage des abonnements actifs

### Index composés
- `{ userId: 1, isActive: 1 }` : Recherche optimisée des abonnements actifs d'un utilisateur
- `{ lastUsedAt: 1 }` : Nettoyage des anciens abonnements

---

## 🛠️ Méthodes disponibles

### Méthodes d'instance

#### `toPushSubscription()`
Convertit l'abonnement au format attendu par `web-push` :
```javascript
const subscription = await PushSubscription.findOne({ userId: user._id });
const pushSub = subscription.toPushSubscription();
// Retourne: { endpoint: "...", keys: { p256dh: "...", auth: "..." } }
```

#### `deactivate()`
Désactive un abonnement sans le supprimer :
```javascript
await subscription.deactivate();
```

#### `updateLastUsed()`
Met à jour la date de dernière utilisation :
```javascript
await subscription.updateLastUsed();
```

### Méthodes statiques

#### `findActiveByUserId(userId)`
Trouve tous les abonnements actifs d'un utilisateur :
```javascript
const subscriptions = await PushSubscription.findActiveByUserId(user._id);
```

#### `findByEndpoint(endpoint)`
Trouve un abonnement par son endpoint :
```javascript
const subscription = await PushSubscription.findByEndpoint(endpoint);
```

---

## 💡 Cas d'usage

### 1. Créer un nouvel abonnement

```javascript
import PushSubscription from './models/PushSubscription.js';

const subscription = await PushSubscription.create({
  userId: user._id,
  endpoint: pushSubscription.endpoint,
  p256dh: pushSubscription.keys.p256dh,
  auth: pushSubscription.keys.auth,
  deviceInfo: 'Chrome on Windows',
  userAgent: req.headers['user-agent']
});
```

### 2. Trouver tous les abonnements actifs d'un utilisateur

```javascript
const subscriptions = await PushSubscription.findActiveByUserId(user._id);
```

### 3. Envoyer une notification à tous les appareils d'un utilisateur

```javascript
import { sendPushNotification } from '../config/push.js';

const subscriptions = await PushSubscription.findActiveByUserId(user._id);

for (const sub of subscriptions) {
  const pushSub = sub.toPushSubscription();
  await sendPushNotification(pushSub, {
    title: 'Nouveau message',
    body: 'Vous avez reçu un nouveau message'
  });
  
  // Mettre à jour la date de dernière utilisation
  await sub.updateLastUsed();
}
```

### 4. Désactiver un abonnement expiré (erreur 410)

```javascript
const subscription = await PushSubscription.findByEndpoint(endpoint);

if (subscription) {
  await subscription.deactivate();
  // Ou supprimer complètement :
  // await PushSubscription.deleteOne({ _id: subscription._id });
}
```

### 5. Nettoyer les anciens abonnements inactifs

```javascript
// Supprimer les abonnements inactifs depuis plus de 90 jours
const ninetyDaysAgo = new Date();
ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);

await PushSubscription.deleteMany({
  isActive: false,
  lastUsedAt: { $lt: ninetyDaysAgo }
});
```

---

## 🔐 Sécurité

### Validation
- ✅ `userId` : Doit être un ObjectId valide référençant un User existant
- ✅ `endpoint` : Doit être unique (un endpoint = un abonnement)
- ✅ `p256dh` et `auth` : Doivent être présents et non vides

### Bonnes pratiques
1. **Ne jamais exposer les clés** (`p256dh`, `auth`) dans les réponses API publiques
2. **Vérifier l'authentification** avant de créer/modifier un abonnement
3. **Nettoyer régulièrement** les abonnements expirés/inactifs
4. **Limiter le nombre d'abonnements** par utilisateur (ex: max 5 appareils)

---

## 📊 Relations

```
User (1) ──< (N) PushSubscription
```

- Un utilisateur peut avoir **plusieurs abonnements** (différents navigateurs/appareils)
- Chaque abonnement appartient à **un seul utilisateur**
- Relation via `userId` (référence vers `User._id`)

---

## 🧹 Nettoyage et maintenance

### Script de nettoyage recommandé

```javascript
// Supprimer les abonnements inactifs depuis plus de 90 jours
async function cleanupOldSubscriptions() {
  const ninetyDaysAgo = new Date();
  ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);
  
  const result = await PushSubscription.deleteMany({
    isActive: false,
    lastUsedAt: { $lt: ninetyDaysAgo }
  });
  
  console.log(`🧹 ${result.deletedCount} abonnements supprimés`);
}
```

### Tâche cron recommandée

Exécuter ce nettoyage une fois par semaine pour éviter l'accumulation d'abonnements inactifs.

---

## ✅ Checklist d'implémentation

- [x] Modèle `PushSubscription` créé
- [x] Champs obligatoires définis (userId, endpoint, p256dh, auth)
- [x] Champs optionnels ajoutés (deviceInfo, userAgent, isActive, lastUsedAt)
- [x] Index créés pour optimiser les requêtes
- [x] Méthodes utilitaires ajoutées (toPushSubscription, findActiveByUserId, etc.)
- [x] Documentation complète créée
- [ ] Routes API pour créer/supprimer des abonnements (prochaine étape)
- [ ] Validation côté serveur avant création
- [ ] Limite du nombre d'abonnements par utilisateur
