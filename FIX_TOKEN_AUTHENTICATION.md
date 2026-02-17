# 🔧 Correction de l'authentification - Token manquant

## ❌ Problème

```
GET /api/push/subscriptions avec body
❌ Aucun token trouvé dans la requête
   - Cookies: [Object: null prototype] {}
   - Authorization header: undefined
```

**Cause** : Les requêtes vers les routes push n'incluaient pas le token d'authentification dans le header `Authorization`. Le token est stocké dans `localStorage`, pas dans les cookies.

---

## ✅ Solution appliquée

### Ajout d'une fonction utilitaire

```javascript
/**
 * Récupère le token d'authentification depuis localStorage
 * 
 * @returns {string|null} Token JWT ou null
 */
function getAuthToken() {
  return localStorage.getItem('token') || null;
}
```

### Modification de toutes les fonctions qui font des requêtes authentifiées

#### 1. `getUserSubscriptions()`

**Avant** :
```javascript
const response = await fetch(`${CONFIG.BACKEND_URL}/api/push/subscriptions`, {
  credentials: 'include',
  headers: {
    'Content-Type': 'application/json'
  }
});
```

**Après** :
```javascript
const token = getAuthToken();
const headers = {
  'Content-Type': 'application/json'
};

if (token) {
  headers['Authorization'] = `Bearer ${token}`;
}

const response = await fetch(`${CONFIG.BACKEND_URL}/api/push/subscriptions`, {
  credentials: 'include',
  headers
});
```

#### 2. `subscribeToPushNotifications()`

**Modifié** : Ajout du header `Authorization` avec le token

#### 3. `unsubscribeFromPushNotifications()`

**Modifié** : Ajout du header `Authorization` avec le token

---

## 🔍 Comment ça fonctionne maintenant

1. **Récupération du token** : La fonction `getAuthToken()` récupère le token depuis `localStorage`
2. **Ajout du header** : Si le token existe, il est ajouté dans le header `Authorization: Bearer <token>`
3. **Backend** : Le middleware `authenticate` dans le backend vérifie :
   - D'abord les cookies (`safitech_token`)
   - Puis le header `Authorization: Bearer <token>`

---

## 🧪 Test de vérification

### 1. Vérifier que le token est présent

Dans la console du navigateur :
```javascript
localStorage.getItem('token')
// Doit retourner un token JWT
```

### 2. Vérifier les requêtes dans Network

1. Ouvrez DevTools > Network
2. Filtrez par "push"
3. Cliquez sur une requête (ex: `/api/push/subscriptions`)
4. Vérifiez l'onglet **Headers**
5. **Résultat attendu** :
   ```
   Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
   ```

### 3. Vérifier les logs du backend

**Avant** :
```
❌ Aucun token trouvé dans la requête
   - Cookies: {}
   - Authorization header: undefined
```

**Après** :
```
🔐 Token récupéré depuis header Authorization
✅ Utilisateur authentifié: user@example.com
```

---

## 📋 Fonctions modifiées

- ✅ `getUserSubscriptions()` - Récupération des abonnements
- ✅ `subscribeToPushNotifications()` - Abonnement
- ✅ `unsubscribeFromPushNotifications()` - Désabonnement

---

## ✅ Résultat

Après cette correction :

- ✅ Le token est maintenant envoyé dans toutes les requêtes push
- ✅ Le backend peut authentifier l'utilisateur
- ✅ Plus d'erreur 401 "Token manquant"
- ✅ Les abonnements peuvent être chargés correctement

**L'authentification fonctionne maintenant correctement ! 🎉**

---

## 🔐 Notes importantes

1. **Token dans localStorage** : Le token est stocké dans `localStorage`, pas dans les cookies
2. **Header Authorization** : Le backend accepte le token via le header `Authorization: Bearer <token>`
3. **Fallback cookies** : Le backend vérifie aussi les cookies (`safitech_token`) en priorité
4. **Sécurité** : Le token est envoyé uniquement sur HTTPS en production
