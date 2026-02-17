# 🔧 Fix : URI de redirection Facebook invalide

## ❌ Erreur rencontrée

```
Ceci n'est pas un URI de redirection valide pour cette application
Vous pouvez rendre cette URI valide en l'ajoutant à la liste des URI de redirection OAuth valides
```

⚠️ **Note importante** : Si vous voyez ce message mais que votre application est en **mode développement**, les redirections `http://localhost` sont automatiquement autorisées. Le problème peut venir d'autre chose (voir ci-dessous).

## ✅ Solution étape par étape

### ⚠️ IMPORTANT : Mode développement

**Les redirections `http://localhost` sont automatiquement autorisées en mode développement.** Vous n'avez **PAS besoin** de les ajouter manuellement dans les paramètres Facebook Login.

### 1. Vérifier que l'application est en mode développement

1. Allez sur [Facebook Developers](https://developers.facebook.com/)
2. Sélectionnez votre application
3. En haut à droite, vérifiez que vous voyez **"Mode développement"** (pas "En direct")
4. Si vous êtes en "En direct", passez en mode développement :
   - Cliquez sur le sélecteur de mode → "Mode développement"

### 2. Vérifier le callback URL dans votre code

Le callback URL doit être exactement :
```
http://localhost:3000/auth/facebook/callback
```

Vérifiez que votre fichier `backend/.env` contient :
```bash
BACKEND_URL=http://localhost:3000
```

Ou si vous utilisez `META_REDIRECT_URI` :
```bash
META_REDIRECT_URI=http://localhost:3000/auth/facebook/callback
```

### 3. Pour la production uniquement

Si vous déployez en production, vous devrez alors ajouter l'URL de production dans les paramètres :
1. Allez dans "Facebook Login" → "Paramètres"
2. Ajoutez votre URL de production :
   ```
   https://votre-domaine.com/auth/facebook/callback
   ```

### 3. Vérifier le port et le callback URL

Assurez-vous que le port correspond à celui de votre backend :
- Si votre backend tourne sur le port **3000** → `http://localhost:3000/auth/facebook/callback`
- Si votre backend tourne sur le port **5000** → `http://localhost:5000/auth/facebook/callback`

Pour vérifier votre port backend, regardez les logs au démarrage :
```
🚀 Backend running on port 3000
```

**Vérifiez aussi les logs lors de la connexion Facebook** - vous devriez voir :
```
🔐 Génération URL OAuth Facebook pour utilisateur ...
   Callback URL: http://localhost:3000/auth/facebook/callback
   BACKEND_URL: http://localhost:3000
```

Si le callback URL ne correspond pas, vérifiez votre fichier `.env` :
```bash
BACKEND_URL=http://localhost:3000  # Doit correspondre au port utilisé
```

Ou si vous utilisez `META_REDIRECT_URI` :
```bash
META_REDIRECT_URI=http://localhost:3000/auth/facebook/callback
```

### 4. Enregistrer les modifications

1. Cliquez sur **"Enregistrer les modifications"** en bas de la page
2. Attendez quelques secondes pour que les changements soient pris en compte

### 5. Vérifier dans votre .env

Vérifiez que votre fichier `backend/.env` contient bien :

```bash
META_APP_ID=votre_app_id
META_APP_SECRET=votre_app_secret
BACKEND_URL=http://localhost:3000  # Doit correspondre au port utilisé
```

Ou si vous utilisez les variables META_* :
```bash
META_APP_ID=votre_app_id
META_APP_SECRET=votre_app_secret
META_REDIRECT_URI=http://localhost:3000/auth/facebook/callback
```

### 6. Redémarrer le serveur

Après avoir ajouté l'URI dans Facebook, redémarrez votre serveur backend :

```bash
cd backend
npm start
```

## 🔍 Vérification

Pour vérifier que tout fonctionne :

1. **Vérifiez que votre application est en mode développement** (en haut à droite dans Facebook Developers)
2. **Vérifiez les logs du serveur** - le callback URL doit être correct
3. **Essayez de vous connecter via votre application**
4. Si vous êtes en mode développement, vous ne devriez **PAS** avoir besoin d'ajouter l'URI manuellement

## 🐛 Si l'erreur persiste en mode développement

Si vous êtes en mode développement et que l'erreur persiste, vérifiez :

1. **Le callback URL dans les logs** correspond-il exactement à `http://localhost:PORT/auth/facebook/callback` ?
2. **Le port** dans `BACKEND_URL` correspond-il au port réel du serveur ?
3. **Redémarrez le serveur** après modification du `.env`
4. **Videz le cache du navigateur** et réessayez

## ⚠️ Erreurs courantes

### Erreur : "redirect_uri_mismatch"
- **Cause** : L'URI dans Facebook ne correspond pas exactement à celle utilisée dans le code
- **Solution** : Vérifiez que les deux URLs sont identiques (même protocole, même port, même chemin)

### Erreur : "Invalid redirect_uri"
- **Cause** : L'URI n'a pas été enregistrée correctement
- **Solution** : Réessayez d'ajouter l'URI et attendez quelques minutes

### Erreur : Port différent
- **Cause** : Le port dans l'URI Facebook ne correspond pas au port du backend
- **Solution** : Vérifiez le port dans les logs du serveur et mettez à jour l'URI dans Facebook

## 📸 Capture d'écran de référence

Dans Facebook Developers, vous devriez voir quelque chose comme :

```
Facebook Login > Paramètres

URL de redirection OAuth valides
┌─────────────────────────────────────────────────────────┐
│ http://localhost:3000/auth/facebook/callback            │
│                                                         │
│ [+ Ajouter une URI]                                     │
└─────────────────────────────────────────────────────────┘

[Enregistrer les modifications]
```

## 🚀 Après configuration

Une fois l'URI ajoutée, vous pouvez tester la connexion Facebook dans votre application. L'erreur devrait disparaître !

