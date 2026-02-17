# 🪜 ÉTAPE 1 — Génération des clés VAPID

## 📋 Qu'est-ce que VAPID ?

**VAPID** (Voluntary Application Server Identification) est un protocole qui permet d'identifier votre serveur auprès des navigateurs pour l'envoi de notifications push web. Il garantit que seuls les serveurs autorisés peuvent envoyer des notifications aux utilisateurs.

## 🔑 Les deux clés VAPID

### **Clé publique (Public Key)**
- ✅ **Peut être exposée publiquement** (dans le code frontend)
- ✅ Utilisée par le navigateur pour **crypter** les données d'abonnement push
- ✅ Permet au navigateur de vérifier que les notifications proviennent bien de votre serveur
- ✅ Format : chaîne de caractères base64url (commence généralement par `B...`)

### **Clé privée (Private Key)**
- 🔒 **DOIT rester secrète** (uniquement dans le backend, jamais dans le code frontend)
- 🔒 Utilisée par le serveur pour **signer** les notifications push
- 🔒 Stockée dans les variables d'environnement (`.env`)
- 🔒 Format : chaîne de caractères base64url (commence généralement par `...`)

## 🚀 Commande pour générer les clés VAPID

### Option 1 : Utiliser npx (recommandé, pas d'installation nécessaire)

```bash
npx web-push generate-vapid-keys
```

### Option 2 : Installer web-push globalement puis générer

```bash
npm install -g web-push
web-push generate-vapid-keys
```

### Option 3 : Installer localement dans le backend

```bash
cd backend
npm install web-push
npx web-push generate-vapid-keys
```

## 📤 Résultat attendu

Après exécution de la commande, vous obtiendrez une sortie similaire à :

```
=======================================

Public Key:
BEl62iUYgUivxIkv69yViEuiBIa40HI9F7D8jW8nN3xrKSHsX2XgLf1yNwcK7NAl2_LhZ2QpYwwpuFoUViXtE

Private Key:
8BW3X4pKJmZwfq5oFWVY7KkZ8j3N2mP5qR7tY9uV1wX2yZ4aB6cD8eF0gH2iJ4kL6mN8oP0qR2sT4uV6wX8yZ

=======================================
```

## 📝 Stockage des clés

### Dans le backend (.env)

Ajoutez ces lignes dans votre fichier `backend/.env` :

```env
VAPID_PUBLIC_KEY=BEl62iUYgUivxIkv69yViEuiBIa40HI9F7D8jW8nN3xrKSHsX2XgLf1yNwcK7NAl2_LhZ2QpYwwpuFoUViXtE
VAPID_PRIVATE_KEY=8BW3X4pKJmZwfq5oFWVY7KkZ8j3N2mP5qR7tY9uV1wX2yZ4aB6cD8eF0gH2iJ4kL6mN8oP0qR2sT4uV6wX8yZ
VAPID_SUBJECT=mailto:votre-email@example.com
```

**Important** : 
- Remplacez `votre-email@example.com` par votre email réel (ou une URL de contact)
- Le champ `VAPID_SUBJECT` est requis et doit être une URL `mailto:` ou `https://`

### Dans le frontend (config)

La clé publique sera utilisée dans le code frontend pour s'abonner aux notifications. Elle peut être stockée dans un fichier de configuration ou une variable d'environnement.

## 🔐 Sécurité

⚠️ **RÈGLES IMPORTANTES** :
1. ❌ **NE JAMAIS** commiter la clé privée dans Git
2. ✅ Ajouter `.env` dans `.gitignore` (déjà fait normalement)
3. ✅ Utiliser des variables d'environnement sur Railway pour la production
4. ✅ La clé publique peut être dans le code frontend (elle est publique par nature)

## ✅ Vérification

Pour vérifier que vos clés sont bien formatées :

```bash
node -e "console.log('Public Key length:', process.env.VAPID_PUBLIC_KEY?.length)"
```

Les clés VAPID font généralement **87 caractères** (format base64url).

## 📚 Ressources

- [Web Push Protocol - VAPID](https://datatracker.ietf.org/doc/html/draft-thomson-webpush-vapid)
- [web-push npm package](https://www.npmjs.com/package/web-push)
