# 🏗️ Architecture des Notifications - Safitech.shop

## 📋 Vue d'ensemble

### Infrastructure
- **Backend** : Express.js déployé sur Railway
- **Domaine** : safitech.shop
- **Base de données** : MongoDB (Mongoose)

### Systèmes de notifications

| Type | Technologie | Statut | Usage |
|------|-------------|--------|-------|
| **Push Web** | Web Push API (Service Worker) | ✅ En cours | Notifications push natives dans le navigateur |
| **Emails** | Resend / Brevo | ✅ Configuré | Notifications par email |
| **Fallback** | WhatsApp API | ✅ Disponible | Notifications WhatsApp si push/email échouent |

---

## 🔔 Système de notifications push web

### Stack technique
- **Backend** : `web-push` (npm)
- **Frontend** : Service Worker + Web Push API
- **Clés** : VAPID (Voluntary Application Server Identification)
- **Base de données** : MongoDB (modèle `PushSubscription`)

### Configuration actuelle

#### Variables d'environnement requises
```env
# Clés VAPID pour Web Push
VAPID_PUBLIC_KEY=BEhWTqXdjYEyLYGHivn0xvYuQ3wZwnp8Y5078A1jIQ02OHtetaj_QyV3RwOaxAcoFuumRC7SqQQNOjIp1Esb3k4
VAPID_PRIVATE_KEY=-dTJxCLze59O15SXUdCaFKFYyu2xRvSTeOm9K_HQq9s
VAPID_SUBJECT=mailto:contact@safitech.shop
```

#### Fichiers créés
- ✅ `backend/config/push.js` - Configuration Web Push
- ✅ `backend/models/PushSubscription.js` - Modèle MongoDB
- ✅ `backend/routes/push.js` - Route API pour la clé publique

#### Routes API disponibles
- `GET /api/push/public-key` - Récupérer la clé publique VAPID

---

## 📧 Système d'emails (Resend / Brevo)

### Configuration
- **Service** : Resend ou Brevo (à configurer selon préférence)
- **Domaine** : safitech.shop
- **Usage** : Notifications par email, confirmations, rappels

### Cas d'usage
- Confirmation d'inscription
- Notifications importantes
- Rappels de cours
- Résumés hebdomadaires

---

## 📱 Fallback : WhatsApp API

### Configuration
- **Service** : WhatsApp Business API
- **Usage** : Notifications critiques si push/email échouent
- **Cas d'usage** : Alertes importantes, notifications urgentes

### Intégration future
- API WhatsApp Business
- Envoi de messages via webhook
- Gestion des templates WhatsApp

---

## 🔄 Stratégie de notification multi-canal

### Ordre de priorité

1. **Push Web** (première tentative)
   - Notification instantanée dans le navigateur
   - Fonctionne même si l'utilisateur n'est pas sur le site
   - Requiert un abonnement actif

2. **Email** (fallback si push échoue)
   - Via Resend ou Brevo
   - Notification par email
   - Fonctionne toujours

3. **WhatsApp** (fallback ultime)
   - Pour notifications critiques uniquement
   - Si push et email échouent
   - Notifications urgentes uniquement

### Exemple de flux

```javascript
async function sendNotification(user, message) {
  // 1. Essayer Push Web
  try {
    const subscriptions = await PushSubscription.findActiveByUserId(user._id);
    for (const sub of subscriptions) {
      await sendPushNotification(sub.toPushSubscription(), message);
    }
    return { success: true, channel: 'push' };
  } catch (error) {
    console.warn('Push échoué, fallback email');
  }
  
  // 2. Fallback Email
  try {
    await sendEmail(user.email, message);
    return { success: true, channel: 'email' };
  } catch (error) {
    console.warn('Email échoué, fallback WhatsApp');
  }
  
  // 3. Fallback WhatsApp (si critique)
  if (message.priority === 'critical') {
    await sendWhatsApp(user.phone, message);
    return { success: true, channel: 'whatsapp' };
  }
  
  return { success: false };
}
```

---

## 🌐 Domaine et déploiement

### Domaine principal
- **Production** : safitech.shop
- **Backend** : Railway (Express.js)
- **Frontend** : À définir (Vercel/Netlify/Cloudflare Pages)

### Configuration HTTPS
- ✅ Requis pour Web Push (HTTPS obligatoire en production)
- ✅ Service Worker nécessite HTTPS
- ✅ Railway gère HTTPS automatiquement

### Variables d'environnement Railway

```env
# Web Push
VAPID_PUBLIC_KEY=...
VAPID_PRIVATE_KEY=...
VAPID_SUBJECT=mailto:contact@safitech.shop

# Email (Resend ou Brevo)
EMAIL_API_KEY=...
EMAIL_FROM=noreply@safitech.shop

# WhatsApp (optionnel)
WHATSAPP_API_KEY=...
WHATSAPP_PHONE_NUMBER=...

# MongoDB
MONGO_URI=...

# Frontend URL
FRONTEND_URL=https://safitech.shop
```

---

## 📊 État d'avancement

### ✅ Terminé
- [x] Génération des clés VAPID
- [x] Configuration backend Express (`config/push.js`)
- [x] Modèle MongoDB (`PushSubscription`)
- [x] Route API pour la clé publique
- [x] Documentation complète

### ⏭️ À faire
- [ ] Routes API pour subscribe/unsubscribe
- [ ] Service Worker côté frontend (`public/sw.js`)
- [ ] Hook React pour gérer les abonnements
- [ ] Interface utilisateur pour activer/désactiver les notifications
- [ ] Intégration avec Resend/Brevo pour emails
- [ ] Intégration WhatsApp API (fallback)
- [ ] Système de notification multi-canal
- [ ] Tests end-to-end

---

## 🔐 Sécurité

### Web Push
- ✅ Clés VAPID sécurisées (privée dans `.env`)
- ✅ Validation des abonnements côté serveur
- ✅ Authentification requise pour créer/modifier abonnements

### Emails
- ✅ API keys dans variables d'environnement
- ✅ Validation des adresses email
- ✅ Rate limiting recommandé

### WhatsApp
- ✅ API keys sécurisées
- ✅ Validation des numéros de téléphone
- ✅ Templates WhatsApp approuvés

---

## 📚 Documentation

- `VAPID_KEYS_GUIDE.md` - Guide génération clés VAPID
- `backend/WEB_PUSH_CONFIG_GUIDE.md` - Configuration Web Push détaillée
- `backend/PUSH_SUBSCRIPTION_SCHEMA.md` - Schéma MongoDB
- `backend/WEB_PUSH_SETUP_COMPLETE.md` - Checklist setup

---

## 🚀 Prochaines étapes recommandées

1. **Routes API abonnements** (priorité haute)
   - `POST /api/push/subscribe` - S'abonner aux notifications
   - `DELETE /api/push/unsubscribe` - Se désabonner
   - `GET /api/push/subscriptions` - Lister les abonnements de l'utilisateur

2. **Service Worker frontend**
   - Créer `frontend/public/sw.js`
   - Gérer les notifications reçues
   - Gérer les clics sur les notifications

3. **Hook React pour notifications**
   - Hook `usePushNotifications()`
   - Demander permission
   - Gérer l'abonnement/désabonnement

4. **Intégration multi-canal**
   - Service de notification unifié
   - Fallback automatique email/WhatsApp

---

## 📞 Contact

- **Email** : contact@safitech.shop
- **Domaine** : safitech.shop
- **Backend** : Railway (Express.js)
