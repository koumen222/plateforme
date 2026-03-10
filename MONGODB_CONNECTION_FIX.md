# 🔧 Guide de Résolution des Problèmes de Connexion MongoDB

## ❌ Erreur : "Server selection timed out after 5000 ms"

Cette erreur indique que MongoDB Atlas ne peut pas être atteint dans le délai imparti.

## ✅ Solutions

### 1. **Autoriser votre IP dans MongoDB Atlas** (Solution la plus courante)

1. Connectez-vous à [MongoDB Atlas](https://cloud.mongodb.com/)
2. Allez dans votre projet/cluster
3. Cliquez sur **"Network Access"** dans le menu de gauche
4. Cliquez sur **"Add IP Address"**
5. Pour le développement local, vous avez deux options :
   - **Option A (Recommandée pour dev)** : Ajoutez `0.0.0.0/0` pour autoriser toutes les IP
     - ⚠️ **Attention** : Ne faites cela que pour le développement, pas en production !
   - **Option B (Plus sécurisée)** : Ajoutez votre IP spécifique
     - Cliquez sur "Add Current IP Address" pour ajouter automatiquement votre IP
6. Cliquez sur **"Confirm"**
7. Attendez 1-2 minutes que les changements soient appliqués

### 2. **Vérifier l'URI de Connexion**

Vérifiez que votre fichier `.env` dans `backend/` contient une URI correcte :

```env
MONGO_URI=mongodb+srv://username:password@cluster0.amitjh7.mongodb.net/plateforme?retryWrites=true&w=majority&appName=Cluster0
```

**Points à vérifier :**
- ✅ Le `username` et `password` sont corrects (sans caractères spéciaux encodés)
- ✅ Le nom du cluster (`cluster0.amitjh7`) correspond à votre cluster
- ✅ Le nom de la base de données (`plateforme`) est correct

### 3. **Vérifier les Credentials**

1. Dans MongoDB Atlas, allez dans **"Database Access"**
2. Vérifiez que votre utilisateur existe et est actif
3. Si nécessaire, réinitialisez le mot de passe
4. **Important** : Si votre mot de passe contient des caractères spéciaux, vous devez les encoder dans l'URI :
   - `@` devient `%40`
   - `:` devient `%3A`
   - `#` devient `%23`
   - etc.

### 4. **Tester la Connexion**

Après avoir autorisé votre IP, attendez 1-2 minutes puis relancez le serveur :

```bash
cd backend
npm start
```

### 5. **Vérifier votre Connexion Internet**

Si le problème persiste :
- Vérifiez que vous avez une connexion internet active
- Essayez de ping `cluster0.amitjh7.mongodb.net` depuis votre terminal
- Vérifiez si un firewall ou VPN bloque la connexion

## 🔍 Diagnostic

La nouvelle configuration MongoDB inclut :
- ✅ Timeout augmenté à 30 secondes (au lieu de 5s)
- ✅ Options de connexion optimisées pour Atlas
- ✅ Messages d'erreur plus détaillés
- ✅ Gestion améliorée des erreurs

## 📝 Exemple d'URI Correcte

```env
# Format général
MONGO_URI=mongodb+srv://username:password@cluster.mongodb.net/database?retryWrites=true&w=majority

# Exemple concret
MONGO_URI=mongodb+srv://admin:MyP@ssw0rd123@cluster0.amitjh7.mongodb.net/plateforme?retryWrites=true&w=majority&appName=Cluster0
```

## 🚨 Erreurs Communes

### "authentication failed"
- **Cause** : Username ou password incorrect
- **Solution** : Vérifiez les credentials dans MongoDB Atlas > Database Access

### "ENOTFOUND"
- **Cause** : Impossible de résoudre le nom de domaine
- **Solution** : Vérifiez votre connexion internet

### "MongoParseError"
- **Cause** : URI mal formatée
- **Solution** : Vérifiez le format de l'URI dans votre `.env`

## 💡 Astuce

Pour obtenir votre URI de connexion complète depuis MongoDB Atlas :
1. Allez dans votre cluster
2. Cliquez sur **"Connect"**
3. Sélectionnez **"Connect your application"**
4. Copiez l'URI fournie
5. Remplacez `<password>` par votre mot de passe réel
6. Ajoutez le nom de votre base de données après le `/` final

