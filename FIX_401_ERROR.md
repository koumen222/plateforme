# 🔧 Correction de l'erreur 401 (Unauthorized)

## ❌ Problème

L'erreur `401 (Unauthorized)` se produit lors de la récupération des abonnements push car :

1. Le hook `usePushNotifications` charge les abonnements au démarrage **sans vérifier l'authentification**
2. La fonction `getUserSubscriptions()` ne gère pas correctement les erreurs d'authentification
3. L'appel API est fait même si l'utilisateur n'est pas connecté

## ✅ Solution appliquée

### 1. Modification du hook `usePushNotifications.jsx`

**Changements** :
- ✅ Import de `useAuth` pour vérifier l'authentification
- ✅ Vérification de `isAuthenticated` et `user?.status === 'active'` avant de charger les abonnements
- ✅ Gestion silencieuse des erreurs 401 (non authentifié)
- ✅ Dépendances ajoutées dans `useEffect` : `[isAuthenticated, user]`

**Code modifié** :
```jsx
// Avant
useEffect(() => {
  // Charger les abonnements sans vérifier l'auth
  const userSubscriptions = await getUserSubscriptions();
}, []);

// Après
useEffect(() => {
  // Charger UNIQUEMENT si authentifié et actif
  if (isAuthenticated && user?.status === 'active' && currentPermission === 'granted') {
    try {
      const userSubscriptions = await getUserSubscriptions();
      setSubscriptions(userSubscriptions);
    } catch (error) {
      if (error.message.includes('401') || error.message.includes('Unauthorized')) {
        console.log('ℹ️ Utilisateur non authentifié, abonnements non chargés');
      }
    }
  }
}, [isAuthenticated, user]);
```

### 2. Amélioration de `getUserSubscriptions()`

**Changements** :
- ✅ Gestion spécifique des erreurs 401
- ✅ Message d'erreur plus clair
- ✅ Ne log pas les erreurs 401 (attendues si non authentifié)

**Code modifié** :
```javascript
if (!response.ok) {
  if (response.status === 401) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(`Non authentifié: ${errorData.message || 'Token manquant ou invalide'}`);
  }
  throw new Error(`Erreur HTTP: ${response.status}`);
}
```

### 3. Amélioration du composant `PushNotificationButton`

**Changements** :
- ✅ Ne pas afficher pendant le chargement initial si pas d'abonnement

---

## 🧪 Test de la correction

### 1. Test sans être connecté

1. Ouvrez `http://localhost:5173` **sans vous connecter**
2. Ouvrez la console (F12)
3. **Résultat attendu** : 
   - ✅ Pas d'erreur 401 dans la console
   - ✅ Message : `ℹ️ Utilisateur non authentifié, abonnements non chargés` (si log activé)
   - ✅ Le bouton de notifications n'apparaît pas

### 2. Test en étant connecté

1. Connectez-vous avec un compte actif
2. Ouvrez la console
3. **Résultat attendu** :
   - ✅ Pas d'erreur 401
   - ✅ Les abonnements sont chargés (si existants)
   - ✅ Le bouton de notifications apparaît

### 3. Test avec compte non actif

1. Connectez-vous avec un compte `status: 'pending'`
2. **Résultat attendu** :
   - ✅ Pas d'erreur 401
   - ✅ Le bouton de notifications n'apparaît pas
   - ✅ Les abonnements ne sont pas chargés

---

## 🔍 Vérifications

### Vérifier que la correction fonctionne

1. **Console du navigateur** :
   - ✅ Plus d'erreur `Failed to load resource: 401`
   - ✅ Plus d'erreur `❌ Erreur lors de la récupération des abonnements: Error: Erreur HTTP: 401`

2. **Réseau (Network)** :
   - ✅ La requête `/api/push/subscriptions` n'est **pas** faite si non authentifié
   - ✅ La requête est faite uniquement si authentifié et actif

3. **Comportement** :
   - ✅ Le bouton de notifications apparaît uniquement si connecté et actif
   - ✅ Les abonnements sont chargés uniquement si connecté et actif

---

## 📝 Notes importantes

1. **Authentification requise** : Les routes `/api/push/subscriptions`, `/api/push/subscribe`, etc. nécessitent une authentification
2. **Cookie ou Header** : L'authentification se fait via :
   - Cookie `safitech_token` (préféré)
   - OU Header `Authorization: Bearer <token>`
3. **Compte actif** : Seuls les utilisateurs avec `status: 'active'` peuvent utiliser les notifications push

---

## ✅ Résultat

Après cette correction :

- ✅ Plus d'erreur 401 dans la console
- ✅ Les abonnements sont chargés uniquement si nécessaire
- ✅ Le hook respecte l'état d'authentification
- ✅ Meilleure gestion des erreurs

**L'erreur est maintenant corrigée ! 🎉**
