# Configuration Webhook WhatsApp Réel

## 1. URL Webhook à configurer dans Green API

**URL Webhook:** `https://votre-domaine.com/api/ecom/agent/webhook`

## 2. Configuration dans Green API Console

1. Allez sur https://console.green-api.com
2. Sélectionnez votre instance `7103497791`
3. Dans "Paramètres" → "Webhooks"
4. Ajoutez l'URL: `https://votre-domaine.com/api/ecom/agent/webhook`
5. Activez les événements:
   - ✅ `incomingMessageReceived` 
   - ✅ `outgoingMessageStatus`

## 3. Test en local avec ngrok

Pour tester en local :

```bash
# Installer ngrok
npm install -g ngrok

# Exposer le port 3000
ngrok http 3000

# Utiliser l'URL ngrok comme webhook
# Ex: https://abc123.ngrok.io/api/ecom/agent/webhook
```

## 4. Numéro de Test

**Votre numéro:** `237676778377`
**Format WhatsApp:** `237676778377@c.us`

## 5. Test Complet

1. Créer une conversation avec votre numéro
2. Envoyer un message depuis votre téléphone
3. L'agent répond automatiquement
4. Voir la conversation dans l'interface web
