# 📡 Routes API Web Push - Guide complet

## 📋 Routes disponibles

### Route publique (sans authentification)

#### `GET /api/push/public-key`
Récupère la clé publique VAPID nécessaire pour s'abonner aux notifications.

**Réponse** :
```json
{
  "publicKey": "BEhWTqXdjYEyLYGHivn0xvYuQ3wZwnp8Y5078A1jIQ02OHtetaj_QyV3RwOaxAcoFuumRC7SqQQNOjIp1Esb3k4",
  "subject": "mailto:contact@safitech.shop"
}
```

---

### Routes protégées (authentification requise)

Toutes les routes suivantes nécessitent un token JWT valide dans :
- Cookie : `safitech_token`
- OU Header : `Authorization: Bearer <token>`

---

#### `POST /api/push/subscribe`
S'abonner aux notifications push pour un appareil/navigateur.

**Body** :
```json
{
  "endpoint": "https://fcm.googleapis.com/fcm/send/dGhpcyBpcyBhIGZha2UgdG9rZW4...",
  "keys": {
    "p256dh": "BEl62iUYgUivxIkv69yViEuiBIa40HI9F7D8jW8nN3xrKSHsX2XgLf1yNwcK7NAl2_LhZ2QpYwwpuFoUViXtE",
    "auth": "8BW3X4pKJmZwfq5oFWVY7KkZ8j3N2mP5qR7tY9uV1wX2yZ4aB6cD8eF0gH2iJ4kL6mN8oP0qR2sT4uV6wX8yZ"
  },
  "deviceInfo": "Chrome on Windows" // Optionnel
}
```

**Réponse succès (201)** :
```json
{
  "success": true,
  "message": "Abonnement créé avec succès",
  "subscription": {
    "id": "507f1f77bcf86cd799439011",
    "endpoint": "https://fcm.googleapis.com/fcm/send/...",
    "deviceInfo": "Chrome on Windows",
    "isActive": true,
    "createdAt": "2026-01-26T10:00:00.000Z"
  }
}
```

**Réponse si déjà abonné (200)** :
```json
{
  "success": true,
  "message": "Abonnement réactivé",
  "subscription": { ... }
}
```

**Erreurs possibles** :
- `400` : Champs manquants ou limite de 5 appareils atteinte
- `409` : Endpoint déjà utilisé par un autre utilisateur
- `401` : Non authentifié
- `500` : Erreur serveur

**Limites** :
- Maximum **5 appareils** par utilisateur
- Si l'abonnement existe déjà pour cet utilisateur, il est réactivé et mis à jour

---

#### `GET /api/push/subscriptions`
Lister tous les abonnements actifs de l'utilisateur.

**Réponse** :
```json
{
  "success": true,
  "count": 2,
  "subscriptions": [
    {
      "id": "507f1f77bcf86cd799439011",
      "endpoint": "https://fcm.googleapis.com/fcm/send/...",
      "deviceInfo": "Chrome on Windows",
      "userAgent": "Mozilla/5.0...",
      "isActive": true,
      "lastUsedAt": "2026-01-26T10:30:00.000Z",
      "createdAt": "2026-01-26T09:00:00.000Z",
      "updatedAt": "2026-01-26T10:30:00.000Z"
    },
    {
      "id": "507f1f77bcf86cd799439012",
      "endpoint": "https://updates.push.services.mozilla.com/...",
      "deviceInfo": "Firefox on Android",
      "isActive": true,
      "lastUsedAt": "2026-01-26T09:15:00.000Z",
      "createdAt": "2026-01-26T08:00:00.000Z",
      "updatedAt": "2026-01-26T09:15:00.000Z"
    }
  ]
}
```

**Note** : Les endpoints sont masqués pour la sécurité (seuls les 50 premiers caractères sont affichés).

---

#### `DELETE /api/push/unsubscribe`
Se désabonner d'un appareil spécifique.

**Body** :
```json
{
  "endpoint": "https://fcm.googleapis.com/fcm/send/dGhpcyBpcyBhIGZha2UgdG9rZW4..."
}
```

**OU Query params** :
```
DELETE /api/push/unsubscribe?endpoint=https://fcm.googleapis.com/fcm/send/...
```

**Réponse succès** :
```json
{
  "success": true,
  "message": "Abonnement supprimé avec succès"
}
```

**Erreurs possibles** :
- `400` : Endpoint manquant
- `404` : Abonnement non trouvé
- `403` : Abonnement n'appartient pas à l'utilisateur
- `401` : Non authentifié

---

#### `DELETE /api/push/unsubscribe-all`
Se désabonner de tous les appareils.

**Réponse succès** :
```json
{
  "success": true,
  "message": "Tous les abonnements ont été supprimés",
  "deletedCount": 3
}
```

**Erreurs possibles** :
- `401` : Non authentifié
- `500` : Erreur serveur

---

## 🔐 Authentification

Toutes les routes protégées nécessitent un token JWT valide.

### Méthode 1 : Cookie
```javascript
// Le cookie est envoyé automatiquement par le navigateur
fetch('/api/push/subscribe', {
  method: 'POST',
  credentials: 'include', // Important !
  headers: {
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({ ... })
});
```

### Méthode 2 : Header Authorization
```javascript
fetch('/api/push/subscribe', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  },
  body: JSON.stringify({ ... })
});
```

---

## 💡 Exemples d'utilisation

### Exemple 1 : S'abonner aux notifications

```javascript
// 1. Récupérer la clé publique
const { publicKey, subject } = await fetch('/api/push/public-key')
  .then(res => res.json());

// 2. Demander la permission et s'abonner (côté frontend)
const registration = await navigator.serviceWorker.ready;
const subscription = await registration.pushManager.subscribe({
  userVisibleOnly: true,
  applicationServerKey: urlBase64ToUint8Array(publicKey)
});

// 3. Envoyer l'abonnement au backend
const response = await fetch('/api/push/subscribe', {
  method: 'POST',
  credentials: 'include',
  headers: {
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    endpoint: subscription.endpoint,
    keys: {
      p256dh: arrayBufferToBase64(subscription.getKey('p256dh')),
      auth: arrayBufferToBase64(subscription.getKey('auth'))
    },
    deviceInfo: `${navigator.userAgentData?.platform || 'Unknown'} on ${navigator.userAgentData?.brands?.[0]?.brand || 'Unknown'}`
  })
});

const result = await response.json();
console.log('Abonnement créé:', result);
```

### Exemple 2 : Lister les abonnements

```javascript
const response = await fetch('/api/push/subscriptions', {
  credentials: 'include'
});

const { subscriptions } = await response.json();
console.log(`Vous avez ${subscriptions.length} appareil(s) abonné(s)`);
```

### Exemple 3 : Se désabonner

```javascript
// Désabonner un appareil spécifique
const subscription = await registration.pushManager.getSubscription();

await fetch('/api/push/unsubscribe', {
  method: 'DELETE',
  credentials: 'include',
  headers: {
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    endpoint: subscription.endpoint
  })
});

// Se désabonner du navigateur
await subscription.unsubscribe();
```

### Exemple 4 : Se désabonner de tous les appareils

```javascript
const response = await fetch('/api/push/unsubscribe-all', {
  method: 'DELETE',
  credentials: 'include'
});

const { deletedCount } = await response.json();
console.log(`${deletedCount} appareil(s) désabonné(s)`);
```

---

## 🛠️ Fonctions utilitaires frontend

### Convertir la clé publique VAPID

```javascript
/**
 * Convertit une clé publique VAPID (base64url) en Uint8Array
 * Nécessaire pour subscribe() de PushManager
 */
function urlBase64ToUint8Array(base64String) {
  const padding = '='.repeat((4 - base64String.length % 4) % 4);
  const base64 = (base64String + padding)
    .replace(/\-/g, '+')
    .replace(/_/g, '/');

  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}
```

### Convertir les clés d'abonnement

```javascript
/**
 * Convertit un ArrayBuffer en base64
 * Pour envoyer les clés p256dh et auth au backend
 */
function arrayBufferToBase64(buffer) {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return window.btoa(binary)
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=/g, '');
}
```

---

## 🔍 Gestion des erreurs

### Erreurs communes

| Code | Erreur | Solution |
|------|--------|----------|
| `400` | Limite atteinte (5 appareils) | Désabonner un appareil existant |
| `401` | Non authentifié | Vérifier le token JWT |
| `403` | Accès refusé | L'abonnement n'appartient pas à l'utilisateur |
| `404` | Abonnement non trouvé | Vérifier l'endpoint |
| `409` | Endpoint déjà utilisé | L'abonnement existe déjà |
| `500` | Erreur serveur | Vérifier les logs backend |

### Exemple de gestion d'erreurs

```javascript
try {
  const response = await fetch('/api/push/subscribe', {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(subscriptionData)
  });

  if (!response.ok) {
    const error = await response.json();
    
    if (response.status === 400 && error.error.includes('Limite atteinte')) {
      alert('Vous avez atteint la limite de 5 appareils. Veuillez en supprimer un.');
    } else if (response.status === 409) {
      console.log('Déjà abonné, réactivation...');
    } else {
      throw new Error(error.message || 'Erreur lors de l\'abonnement');
    }
  }

  const result = await response.json();
  console.log('Succès:', result);
} catch (error) {
  console.error('Erreur:', error);
}
```

---

## ✅ Checklist d'implémentation

- [x] Route `GET /api/push/public-key` (publique)
- [x] Route `POST /api/push/subscribe` (protégée)
- [x] Route `GET /api/push/subscriptions` (protégée)
- [x] Route `DELETE /api/push/unsubscribe` (protégée)
- [x] Route `DELETE /api/push/unsubscribe-all` (protégée)
- [x] Validation des données
- [x] Gestion des erreurs
- [x] Limite de 5 appareils par utilisateur
- [x] Réactivation des abonnements existants
- [x] Documentation complète

---

## 📚 Prochaines étapes

1. ✅ Routes API créées (TERMINÉ)
2. ⏭️ Créer le Service Worker côté frontend (`public/sw.js`)
3. ⏭️ Créer un hook React `usePushNotifications()`
4. ⏭️ Ajouter l'interface utilisateur pour activer/désactiver
5. ⏭️ Tester l'envoi de notifications
