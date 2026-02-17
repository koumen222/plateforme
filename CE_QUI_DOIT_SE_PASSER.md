# 🔄 Ce qui doit se passer au rechargement de la page

## 📋 Séquence normale au rechargement

### 1. Chargement initial (0-1 seconde)

**Dans la console du navigateur** :
```
🔐 ========== AUTH CONTEXT INIT ==========
✅ Token trouvé dans localStorage
   - Token length: XXX
✅ Utilisateur chargé depuis localStorage: user@example.com
```

**Dans la console du backend** :
```
🚀 Backend running on port 3000
✅ Web Push configuré avec succès
✅ Routes Web Push chargées
```

---

### 2. Vérification de l'authentification (1-2 secondes)

**Dans la console du navigateur** :
```
✅ Service Worker enregistré: /
```

**Dans la console du backend** :
```
🔐 Token récupéré depuis header Authorization
✅ Token valide - Utilisateur: user@example.com
   - Status: active
   - Role: student
```

**Si vous êtes connecté** :
- ✅ Le token est vérifié avec le backend
- ✅ Les données utilisateur sont mises à jour
- ✅ `isAuthenticated` devient `true`

**Si vous n'êtes pas connecté** :
- ⚠️ Pas de token dans localStorage
- ✅ `isAuthenticated` reste `false`
- ✅ Pas d'appel API vers `/api/push/subscriptions`

---

### 3. Initialisation du hook usePushNotifications (2-3 secondes)

**Dans la console du navigateur** :

**Si vous êtes connecté ET actif** :
```
✅ Service Worker enregistré: /
✅ Abonnement push créé: https://fcm.googleapis.com/fcm/send/... (si déjà abonné)
```

**Si vous n'êtes pas connecté** :
```
✅ Service Worker enregistré: /
(rien d'autre, pas d'erreur)
```

**Si vous êtes connecté mais non actif** :
```
✅ Service Worker enregistré: /
(rien d'autre, pas d'erreur 401)
```

---

### 4. Chargement des abonnements (3-4 secondes)

**Dans la console du navigateur** :

**Si vous êtes connecté, actif ET avez des abonnements** :
```
(Rien dans la console, chargement silencieux)
```

**Dans la console du backend** :
```
🔐 Token récupéré depuis header Authorization
GET /api/push/subscriptions 200
```

**Si vous n'êtes pas connecté** :
```
(Rien dans la console, pas d'appel API)
```

---

### 5. Affichage du bouton de notifications (4-5 secondes)

**Dans l'interface** :

**Si vous êtes connecté ET actif** :
- ✅ Le bouton de notifications push apparaît dans le Header
- ✅ Le bouton est gris avec l'icône barrée si non abonné
- ✅ Le bouton est bleu avec l'icône cloche si abonné

**Si vous n'êtes pas connecté** :
- ❌ Le bouton n'apparaît pas

**Si vous êtes connecté mais non actif** :
- ❌ Le bouton n'apparaît pas

---

## ✅ Checklist de vérification

### Console du navigateur (DevTools > Console)

- [ ] ✅ Service Worker enregistré: /
- [ ] ✅ Token trouvé dans localStorage (si connecté)
- [ ] ✅ Utilisateur chargé depuis localStorage (si connecté)
- [ ] ❌ **PAS d'erreur 401**
- [ ] ❌ **PAS d'erreur React Hooks**
- [ ] ❌ **PAS d'erreur "Token manquant"**

### Console du backend

- [ ] ✅ Web Push configuré avec succès
- [ ] ✅ Routes Web Push chargées
- [ ] 🔐 Token récupéré depuis header Authorization (si connecté)
- [ ] GET /api/push/subscriptions 200 (si connecté et actif)
- [ ] ❌ **PAS d'erreur "Aucun token trouvé"**

### Interface utilisateur

- [ ] ✅ Le bouton de notifications apparaît (si connecté et actif)
- [ ] ✅ Le bouton a la bonne couleur selon l'état
- [ ] ✅ Pas d'erreur visible à l'écran

---

## 🚨 Erreurs à ne PAS voir

### ❌ Erreurs à éviter

1. **Erreur 401** :
   ```
   Failed to load resource: 401 (Unauthorized)
   ```
   → **Solution** : Vérifiez que le token est dans localStorage

2. **Erreur React Hooks** :
   ```
   Warning: React has detected a change in the order of Hooks
   ```
   → **Solution** : Rechargez complètement la page (Ctrl+Shift+R)

3. **Erreur "Token manquant"** :
   ```
   ❌ Aucun token trouvé dans la requête
   ```
   → **Solution** : Vérifiez que le header Authorization est envoyé

4. **Erreur Service Worker** :
   ```
   ❌ Erreur lors de l'enregistrement du Service Worker
   ```
   → **Solution** : Vérifiez que vous êtes sur localhost ou HTTPS

---

## 🧪 Test étape par étape

### Test 1 : Sans être connecté

1. **Déconnectez-vous** (ou ouvrez en navigation privée)
2. **Rechargez la page** (F5)
3. **Vérifiez la console** :
   - ✅ Service Worker enregistré
   - ❌ Pas d'erreur 401
   - ❌ Pas d'appel à `/api/push/subscriptions`
   - ❌ Le bouton de notifications n'apparaît pas

### Test 2 : Connecté mais compte non actif

1. **Connectez-vous** avec un compte `status: 'pending'`
2. **Rechargez la page**
3. **Vérifiez** :
   - ✅ Service Worker enregistré
   - ❌ Pas d'erreur 401
   - ❌ Pas d'appel à `/api/push/subscriptions`
   - ❌ Le bouton de notifications n'apparaît pas

### Test 3 : Connecté et actif (cas normal)

1. **Connectez-vous** avec un compte `status: 'active'`
2. **Rechargez la page**
3. **Vérifiez** :
   - ✅ Service Worker enregistré
   - ✅ Token vérifié avec le backend
   - ✅ Appel à `/api/push/subscriptions` (si permission accordée)
   - ✅ Le bouton de notifications apparaît
   - ✅ Le bouton a la bonne couleur selon l'état

---

## 📊 Résumé visuel

```
┌─────────────────────────────────────────┐
│  Rechargement de la page (F5)          │
└─────────────────────────────────────────┘
              │
              ▼
┌─────────────────────────────────────────┐
│  1. Chargement initial                  │
│     - AuthContext init                  │
│     - Token depuis localStorage         │
└─────────────────────────────────────────┘
              │
              ▼
┌─────────────────────────────────────────┐
│  2. Vérification auth                   │
│     - Appel /api/auth/me                │
│     - Token validé                      │
└─────────────────────────────────────────┘
              │
              ▼
┌─────────────────────────────────────────┐
│  3. Service Worker                      │
│     - Enregistrement                    │
│     - Vérification support              │
└─────────────────────────────────────────┘
              │
              ▼
┌─────────────────────────────────────────┐
│  4. Hook usePushNotifications           │
│     - Vérification auth                 │
│     - Chargement abonnements (si auth)  │
└─────────────────────────────────────────┘
              │
              ▼
┌─────────────────────────────────────────┐
│  5. Affichage UI                        │
│     - Bouton notifications (si actif)   │
│     - État correct                      │
└─────────────────────────────────────────┘
```

---

## ✅ Résultat attendu

Après toutes les corrections, au rechargement de la page :

1. ✅ **Pas d'erreur 401** dans la console
2. ✅ **Pas d'erreur React Hooks**
3. ✅ **Pas d'erreur "Token manquant"**
4. ✅ **Service Worker enregistré correctement**
5. ✅ **Le bouton apparaît uniquement si connecté et actif**
6. ✅ **Les abonnements sont chargés silencieusement**

**Tout fonctionne correctement ! 🎉**

---

## 🔍 Si quelque chose ne va pas

### Problème : Erreur 401 persiste

**Vérifications** :
1. Le token est-il dans localStorage ?
   ```javascript
   localStorage.getItem('token')
   ```
2. Le header Authorization est-il envoyé ?
   - DevTools > Network > Headers > Request Headers
   - Cherchez `Authorization: Bearer ...`

### Problème : Le bouton n'apparaît pas

**Vérifications** :
1. Êtes-vous connecté ? (`isAuthenticated === true`)
2. Votre compte est-il actif ? (`user.status === 'active'`)
3. Les notifications sont-elles supportées ? (Chrome/Firefox/Edge)

### Problème : Erreur React Hooks

**Solution** :
1. Videz le cache du navigateur (Ctrl+Shift+Delete)
2. Rechargez complètement (Ctrl+Shift+R)
3. Vérifiez que tous les hooks sont appelés avant les returns

---

## 📝 Notes importantes

1. **Premier chargement** : Peut être plus lent (enregistrement Service Worker)
2. **Rechargements suivants** : Plus rapides (Service Worker déjà enregistré)
3. **Authentification** : Vérifiée à chaque rechargement
4. **Abonnements** : Chargés uniquement si connecté et actif

---

**Tout devrait fonctionner correctement maintenant ! 🚀**
