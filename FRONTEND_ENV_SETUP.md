# 🔧 Configuration des Variables d'Environnement Frontend

## ⚠️ IMPORTANT : Configuration de VITE_API_BASE_URL

La variable d'environnement `VITE_API_BASE_URL` **DOIT** être configurée **SANS slash final** pour éviter les erreurs 404.

### ✅ CORRECT
```
VITE_API_BASE_URL=https://plateforme-backend-production-2ec6.up.railway.app
```

### ❌ INCORRECT (ne pas faire)
```
VITE_API_BASE_URL=https://plateforme-backend-production-2ec6.up.railway.app/
```

## 📋 Configuration par Plateforme

### Cloudflare Pages

1. Allez dans **Dashboard** → Votre projet → **Settings** → **Environment Variables**
2. Ajoutez la variable pour **Production** :
   ```
   Variable name: VITE_API_BASE_URL
   Value: https://plateforme-backend-production-2ec6.up.railway.app
   ```
3. **Important** : Assurez-vous qu'il n'y a **PAS de slash final** dans la valeur
4. Redéployez votre site après avoir ajouté/modifié la variable

### Vercel

1. Allez dans **Project Settings** → **Environment Variables**
2. Ajoutez la variable pour **Production** :
   ```
   Key: VITE_API_BASE_URL
   Value: https://plateforme-backend-production-2ec6.up.railway.app
   ```
3. **Important** : Assurez-vous qu'il n'y a **PAS de slash final** dans la valeur
4. Redéployez votre site après avoir ajouté/modifié la variable

### Netlify

1. Allez dans **Site settings** → **Environment variables**
2. Ajoutez la variable pour **Production** :
   ```
   Key: VITE_API_BASE_URL
   Value: https://plateforme-backend-production-2ec6.up.railway.app
   ```
3. **Important** : Assurez-vous qu'il n'y a **PAS de slash final** dans la valeur
4. Redéployez votre site après avoir ajouté/modifié la variable

## 🔍 Vérification

Après avoir configuré la variable et redéployé :

1. Ouvrez la console du navigateur (F12)
2. Vérifiez les logs au chargement de la page
3. Vous devriez voir : `🌐 MODE PRODUCTION - BACKEND_URL depuis VITE_API_BASE_URL: https://plateforme-backend-production-2ec6.up.railway.app`
4. Les URLs des requêtes API ne doivent **PAS** contenir de double slash (`//`)

## 🐛 Dépannage

### Erreur 404 avec double slash dans l'URL

Si vous voyez toujours `https://plateforme-backend-production-2ec6.up.railway.app//api/...` :

1. **Vérifiez la variable d'environnement** : Assurez-vous qu'elle ne se termine pas par `/`
2. **Redéployez le frontend** : Les variables d'environnement sont injectées au moment du build
3. **Videz le cache du navigateur** : Ctrl+Shift+R (Windows/Linux) ou Cmd+Shift+R (Mac)
4. **Vérifiez les logs de build** : Assurez-vous que la variable est bien injectée

### Comment vérifier la valeur de la variable

Dans la console du navigateur, tapez :
```javascript
console.log(import.meta.env.VITE_API_BASE_URL)
```

La valeur affichée ne doit **PAS** se terminer par `/`.

## 📝 Notes

- Les variables d'environnement Vite doivent commencer par `VITE_` pour être exposées au client
- Les variables sont injectées au moment du **build**, pas au runtime
- Après modification d'une variable d'environnement, vous **DEVEZ** redéployer le frontend
- Le code nettoie automatiquement les slashes finaux, mais il est préférable de configurer correctement dès le départ

