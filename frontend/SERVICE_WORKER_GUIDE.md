# 🔔 Service Worker et Notifications Push - Guide Frontend

## 📋 Vue d'ensemble

Ce guide explique comment utiliser le système de notifications push web natif dans le frontend React.

---

## 📁 Fichiers créés

### 1. Service Worker
- **`public/sw.js`** - Service Worker qui gère les notifications push

### 2. Utilitaires
- **`src/utils/pushNotifications.js`** - Fonctions utilitaires pour gérer les notifications

### 3. Hook React
- **`src/hooks/usePushNotifications.jsx`** - Hook React pour faciliter l'utilisation

---

## 🚀 Utilisation rapide

### Exemple 1 : Utiliser le hook dans un composant

```jsx
import { usePushNotifications } from '../hooks/usePushNotifications';

function NotificationButton() {
  const {
    isSupported,
    permission,
    isSubscribed,
    isLoading,
    subscribe,
    unsubscribe,
    requestPermission
  } = usePushNotifications();

  const handleSubscribe = async () => {
    try {
      if (permission === 'default') {
        await requestPermission();
      }
      await subscribe();
      alert('Notifications activées !');
    } catch (error) {
      alert('Erreur : ' + error.message);
    }
  };

  if (!isSupported) {
    return <div>Les notifications push ne sont pas supportées</div>;
  }

  return (
    <div>
      {isSubscribed ? (
        <button onClick={unsubscribe}>
          Désactiver les notifications
        </button>
      ) : (
        <button onClick={handleSubscribe} disabled={isLoading}>
          {isLoading ? 'Chargement...' : 'Activer les notifications'}
        </button>
      )}
    </div>
  );
}
```

### Exemple 2 : Utiliser les fonctions directement

```jsx
import {
  isPushSupported,
  subscribeToPushNotifications,
  unsubscribeFromPushNotifications,
  getCurrentSubscription
} from '../utils/pushNotifications';

async function enableNotifications() {
  if (!isPushSupported()) {
    alert('Les notifications ne sont pas supportées');
    return;
  }

  try {
    const result = await subscribeToPushNotifications({
      deviceInfo: 'Chrome on Windows'
    });
    console.log('Abonnement réussi:', result);
  } catch (error) {
    console.error('Erreur:', error);
  }
}
```

---

## 🔧 API du Hook `usePushNotifications`

### État retourné

| Propriété | Type | Description |
|-----------|------|-------------|
| `isSupported` | `boolean` | Les notifications push sont-elles supportées ? |
| `permission` | `string` | État de la permission : `'granted'`, `'denied'`, `'default'` |
| `isSubscribed` | `boolean` | L'utilisateur est-il actuellement abonné ? |
| `isLoading` | `boolean` | Une opération est-elle en cours ? |
| `subscriptions` | `Array` | Liste des abonnements de l'utilisateur |
| `error` | `string\|null` | Message d'erreur éventuel |
| `serviceWorkerReady` | `boolean` | Le Service Worker est-il prêt ? |

### Fonctions retournées

| Fonction | Description | Retour |
|----------|-------------|--------|
| `subscribe(options)` | S'abonner aux notifications | `Promise<Object>` |
| `unsubscribe()` | Se désabonner | `Promise<void>` |
| `refreshSubscriptions()` | Rafraîchir la liste des abonnements | `Promise<void>` |
| `requestPermission()` | Demander la permission | `Promise<string>` |

---

## 📡 API des fonctions utilitaires

### Vérification du support

```javascript
import { isPushSupported, getNotificationPermission } from '../utils/pushNotifications';

// Vérifier le support
if (isPushSupported()) {
  console.log('Les notifications sont supportées');
}

// Vérifier la permission
const permission = await getNotificationPermission();
// 'granted', 'denied', ou 'default'
```

### Abonnement

```javascript
import { subscribeToPushNotifications } from '../utils/pushNotifications';

const result = await subscribeToPushNotifications({
  deviceInfo: 'Chrome on Windows' // Optionnel
});

console.log(result);
// {
//   success: true,
//   subscription: { id, endpoint, deviceInfo, ... },
//   pushSubscription: PushSubscription
// }
```

### Désabonnement

```javascript
import { unsubscribeFromPushNotifications } from '../utils/pushNotifications';

await unsubscribeFromPushNotifications();
```

### Vérification de l'abonnement

```javascript
import { getCurrentSubscription, getUserSubscriptions } from '../utils/pushNotifications';

// Abonnement actuel dans ce navigateur
const current = await getCurrentSubscription();

// Tous les abonnements de l'utilisateur (depuis le backend)
const all = await getUserSubscriptions();
```

---

## 🎯 Intégration dans un composant existant

### Exemple : Ajouter un bouton dans le Header

```jsx
// src/components/Header.jsx
import { usePushNotifications } from '../hooks/usePushNotifications';
import { FiBell, FiBellOff } from 'react-icons/fi';

function Header() {
  const {
    isSupported,
    permission,
    isSubscribed,
    isLoading,
    subscribe,
    unsubscribe,
    requestPermission
  } = usePushNotifications();

  const handleToggleNotifications = async () => {
    try {
      if (isSubscribed) {
        await unsubscribe();
      } else {
        if (permission === 'default') {
          const newPermission = await requestPermission();
          if (newPermission !== 'granted') {
            alert('Les notifications sont nécessaires pour recevoir les alertes');
            return;
          }
        }
        await subscribe();
      }
    } catch (error) {
      console.error('Erreur:', error);
      alert('Erreur : ' + error.message);
    }
  };

  if (!isSupported) {
    return null; // Ne pas afficher le bouton si non supporté
  }

  return (
    <button
      onClick={handleToggleNotifications}
      disabled={isLoading}
      className="p-2 rounded-full hover:bg-gray-100"
      title={isSubscribed ? 'Désactiver les notifications' : 'Activer les notifications'}
    >
      {isSubscribed ? (
        <FiBell className="w-5 h-5 text-blue-500" />
      ) : (
        <FiBellOff className="w-5 h-5 text-gray-400" />
      )}
    </button>
  );
}
```

---

## 🔔 Format des notifications

Les notifications envoyées depuis le backend doivent suivre ce format :

```javascript
{
  title: "Titre de la notification",
  body: "Corps du message",
  icon: "/img/logo.svg", // Optionnel
  badge: "/img/logo.svg", // Optionnel
  image: "/img/image.jpg", // Optionnel (image grande)
  tag: "notification-tag", // Optionnel (pour remplacer les notifications similaires)
  data: {
    url: "/page-a-ouvrir", // URL à ouvrir au clic
    // Autres données personnalisées
  }
}
```

---

## 🛠️ Gestion des erreurs

### Erreurs communes

| Erreur | Cause | Solution |
|--------|-------|----------|
| `Les notifications push ne sont pas supportées` | Navigateur non compatible | Utiliser Chrome, Firefox, Edge, Safari |
| `Permission refusée` | L'utilisateur a refusé | Guider l'utilisateur vers les paramètres du navigateur |
| `Service Worker non disponible` | HTTPS requis | Utiliser HTTPS en production |
| `Limite atteinte (5 appareils)` | Trop d'appareils enregistrés | Désabonner un appareil existant |

### Exemple de gestion d'erreurs

```jsx
const handleSubscribe = async () => {
  try {
    await subscribe();
  } catch (error) {
    if (error.message.includes('Limite atteinte')) {
      alert('Vous avez atteint la limite de 5 appareils. Veuillez en supprimer un.');
    } else if (error.message.includes('Permission refusée')) {
      alert('Veuillez autoriser les notifications dans les paramètres de votre navigateur.');
    } else {
      alert('Erreur : ' + error.message);
    }
  }
};
```

---

## 📱 Support des navigateurs

| Navigateur | Support | Notes |
|------------|---------|-------|
| Chrome | ✅ | Support complet |
| Firefox | ✅ | Support complet |
| Edge | ✅ | Support complet |
| Safari | ✅ | macOS 16+ et iOS 16.4+ |
| Opera | ✅ | Support complet |
| IE | ❌ | Non supporté |

**Note** : HTTPS est requis en production pour les Service Workers.

---

## 🔐 Sécurité

### Bonnes pratiques

1. ✅ **HTTPS obligatoire** en production
2. ✅ **Authentification requise** pour s'abonner (géré par le backend)
3. ✅ **Validation des données** côté serveur
4. ✅ **Limite de 5 appareils** par utilisateur

### Permissions

- Les notifications nécessitent la permission explicite de l'utilisateur
- La permission peut être révoquée à tout moment dans les paramètres du navigateur
- Le Service Worker fonctionne même si l'utilisateur n'est pas sur le site

---

## 🧪 Tests

### Test local

1. Démarrer le serveur de développement :
   ```bash
   cd frontend
   npm run dev
   ```

2. Ouvrir le navigateur et vérifier la console :
   - Vous devriez voir : `✅ Service Worker enregistré`

3. Tester l'abonnement :
   - Cliquer sur le bouton d'activation
   - Autoriser les notifications
   - Vérifier que l'abonnement est créé

### Test de notification

Pour tester l'envoi d'une notification, utilisez la console du navigateur :

```javascript
// Dans la console du navigateur
navigator.serviceWorker.ready.then(registration => {
  registration.showNotification('Test', {
    body: 'Ceci est une notification de test',
    icon: '/img/logo.svg',
    badge: '/img/logo.svg',
    data: {
      url: '/'
    }
  });
});
```

---

## 📚 Ressources

- [Web Push API - MDN](https://developer.mozilla.org/en-US/docs/Web/API/Push_API)
- [Service Workers - MDN](https://developer.mozilla.org/en-US/docs/Web/API/Service_Worker_API)
- [Notifications API - MDN](https://developer.mozilla.org/en-US/docs/Web/API/Notifications_API)

---

## ✅ Checklist d'implémentation

- [x] Service Worker créé (`public/sw.js`)
- [x] Fonctions utilitaires créées (`src/utils/pushNotifications.js`)
- [x] Hook React créé (`src/hooks/usePushNotifications.jsx`)
- [x] Service Worker enregistré dans `main.jsx`
- [x] Documentation complète créée
- [ ] Intégration dans un composant (ex: Header)
- [ ] Tests end-to-end
- [ ] Gestion des erreurs dans l'UI

---

## 🚀 Prochaines étapes

1. ✅ Service Worker créé (TERMINÉ)
2. ✅ Hook React créé (TERMINÉ)
3. ⏭️ Intégrer le bouton dans le Header ou un composant dédié
4. ⏭️ Tester l'envoi de notifications depuis le backend
5. ⏭️ Ajouter des notifications pour les événements importants (nouveaux messages, nouveaux cours, etc.)
