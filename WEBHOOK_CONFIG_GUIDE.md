# 🚀 Guide Configuration Webhook Green API

## 📋 Étapes Obligatoires pour que le Système Réponde aux Messages

### 🔍 Étape 1: Vérifier ngrok

```powershell
# Vérifier que ngrok fonctionne
curl http://127.0.0.1:4040/api/tunnels
```

**URL ngrok actuelle :** `https://neda-unspilled-rebbeca.ngrok-free.dev`

---

### 🌐 Étape 2: Configurer le Webhook dans Green API

1. **Connectez-vous à Green API Console**
   - URL : https://console.green-api.com
   - Email : votre email
   - Mot de passe : votre mot de passe

2. **Accédez à votre instance**
   - Instance ID : `7103497791`
   - Téléphone : `237676778377`

3. **Configurez le webhook**
   - Allez dans la section **"Webhooks"**
   - Entrez l'URL : `https://neda-unspilled-rebbeca.ngrok-free.dev/api/ecom/agent/webhook`
   - Sélectionnez les événements :
     - ✅ `incomingMessageReceived`
     - ✅ `messageStatusUpdated`
   - Cliquez sur **"Save"**

---

### 🧪 Étape 3: Tester le Webhook

#### Test 1: Via l'interface web
1. Allez sur : http://localhost:3000/webhook-test.html
2. Cliquez sur "🏥 Tester la santé du webhook"
3. Vous devriez voir : ✅ Webhook opérationnel!

#### Test 2: Message WhatsApp réel
1. Envoyez un message WhatsApp au : `+237676778377`
2. Exemple : "Bonjour, je veux commander une montre"
3. Regardez les logs du serveur

---

### 📊 Étape 4: Vérifier les Logs

Dans les logs du serveur, vous devriez voir :

```
🔔 ===================== WEBHOOK REÇU =====================
📱 ChatId extrait: 237676778377@c.us
📝 Contenu message: Bonjour, je veux commander une montre
🤖 ==================== PROCESSING MESSAGE ====================
🚀 ==================== ENVOI RÉPONSE ====================
✅ Message WhatsApp envoyé avec succès: [ID_MESSAGE]
```

---

### 🚨 Problèmes Courants

#### ❌ "Webhook non configuré"
**Solution :** Configurez l'URL dans Green API Console (Étape 2)

#### ❌ "ngrok ne fonctionne pas"
**Solution :** Redémarrez ngrok
```powershell
npx ngrok http 3000
```

#### ❌ "Message sans texte ignoré"
**Solution :** Envoyez un message avec du texte, pas seulement des emojis

#### ❌ "Pas de réponse générée"
**Solution :** Vérifiez que OpenAI API key est configurée

---

### 🔄 Test Complet

1. **Créez une commande** : http://localhost:3000/new-order-test.html
2. **Configurez le webhook** : Étape 2 ci-dessus
3. **Envoyez un message** : "Bonjour" au +237698459328
4. **Vérifiez la réponse** : Devriez recevoir une réponse automatique

---

### 📞 Numéros de Test

- **Votre numéro** : `+237698459328`
- **Instance Green API** : `7103497791`
- **URL Webhook** : `https://neda-unspilled-rebbeca.ngrok-free.dev/api/ecom/agent/webhook`

---

### ✅ Validation

Si tout fonctionne, vous verrez :
- ✅ Message reçu dans les logs
- ✅ Analyse du message (intention, sentiment)
- ✅ Réponse générée par ChatGPT
- ✅ Réponse envoyée sur WhatsApp
- ✅ Message reçu sur votre téléphone

---

## 🎯 Rappel

**Le webhook ne fonctionnera PAS tant qu'il n'est pas configuré dans Green API Console !**

C'est l'étape la plus importante et souvent oubliée.
