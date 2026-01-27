# 📤 Exemple d'envoi de notifications push

Ce guide montre comment envoyer des notifications push depuis le backend.

## 🚀 Routes API disponibles

### 1. Envoyer une notification à l'utilisateur connecté

**POST** `/api/push/send`

Envoie une notification à tous les appareils de l'utilisateur actuellement connecté.

#### Requête

```bash
POST http://localhost:3000/api/push/send
Authorization: Bearer YOUR_JWT_TOKEN
Content-Type: application/json

{
  "title": "Nouveau message",
  "body": "Vous avez reçu un nouveau message de Jean",
  "icon": "/img/logo.svg",
  "url": "/messages",
  "tag": "new-message-123",
  "data": {
    "messageId": "123",
    "senderId": "456"
  }
}
```

#### Réponse

```json
{
  "success": true,
  "message": "Notification envoyée",
  "sent": 2,
  "failed": 0,
  "total": 2,
  "errors": []
}
```

#### Champs requis

- `title` (string) - Titre de la notification
- `body` (string) - Corps du message

#### Champs optionnels

- `icon` (string) - URL de l'icône (défaut: `/img/logo.svg`)
- `url` (string) - URL à ouvrir au clic (défaut: `/`)
- `tag` (string) - Tag pour remplacer les notifications similaires
- `data` (object) - Données personnalisées

---

### 2. Envoyer une notification à un utilisateur spécifique (Admin)

**POST** `/api/push/send-to-user/:userId`

Envoie une notification à un utilisateur spécifique. **Réservé aux administrateurs.**

#### Requête

```bash
POST http://localhost:3000/api/push/send-to-user/507f1f77bcf86cd799439011
Authorization: Bearer ADMIN_JWT_TOKEN
Content-Type: application/json

{
  "title": "Mise à jour importante",
  "body": "Une nouvelle fonctionnalité est disponible !",
  "icon": "/img/logo.svg",
  "url": "/nouveautes"
}
```

#### Réponse

```json
{
  "success": true,
  "message": "Notification envoyée",
  "sent": 1,
  "failed": 0,
  "total": 1
}
```

---

## 💻 Exemples d'utilisation dans le code

### Exemple 1 : Après création d'un commentaire

```javascript
// backend/routes/comments.js
import { sendPushNotificationToMany } from '../config/push.js';
import PushSubscription from '../models/PushSubscription.js';

router.post('/comments', async (req, res) => {
  try {
    // Créer le commentaire
    const comment = await Comment.create({
      content: req.body.content,
      authorId: req.user._id,
      lessonId: req.body.lessonId
    });

    // Envoyer une notification à tous les utilisateurs abonnés
    const subscriptions = await PushSubscription.find({ isActive: true });
    const pushSubscriptions = subscriptions.map(sub => sub.toPushSubscription());
    
    await sendPushNotificationToMany(pushSubscriptions, {
      title: 'Nouveau commentaire',
      body: `${req.user.name} a commenté : ${comment.content.substring(0, 50)}...`,
      icon: '/img/logo.svg',
      url: `/cours/${req.body.lessonId}`,
      tag: `comment-${comment._id}`
    });

    res.json({ success: true, comment });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});
```

### Exemple 2 : Après réception d'un message

```javascript
// backend/routes/messages.js
import { sendPushNotification } from '../config/push.js';
import PushSubscription from '../models/PushSubscription.js';

router.post('/messages', async (req, res) => {
  try {
    const { recipientId, content } = req.body;
    
    // Créer le message
    const message = await Message.create({
      senderId: req.user._id,
      recipientId,
      content
    });

    // Envoyer une notification au destinataire uniquement
    const subscriptions = await PushSubscription.findActiveByUserId(recipientId);
    
    for (const sub of subscriptions) {
      await sendPushNotification(sub.toPushSubscription(), {
        title: 'Nouveau message',
        body: `${req.user.name} vous a envoyé un message`,
        icon: '/img/logo.svg',
        url: `/messages/${message._id}`,
        tag: `message-${message._id}`,
        data: {
          messageId: message._id.toString(),
          senderId: req.user._id.toString()
        }
      });
    }

    res.json({ success: true, message });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});
```

### Exemple 3 : Notification programmée (Cron)

```javascript
// backend/jobs/daily-notifications.js
import cron from 'node-cron';
import { sendPushNotificationToMany } from '../config/push.js';
import PushSubscription from '../models/PushSubscription.js';

// Envoyer une notification quotidienne à 9h00
cron.schedule('0 9 * * *', async () => {
  console.log('📅 Envoi des notifications quotidiennes...');
  
  const subscriptions = await PushSubscription.find({ isActive: true });
  const pushSubscriptions = subscriptions.map(sub => sub.toPushSubscription());
  
  await sendPushNotificationToMany(pushSubscriptions, {
    title: 'Bonjour ! 👋',
    body: 'N\'oubliez pas de consulter vos cours aujourd\'hui',
    icon: '/img/logo.svg',
    url: '/cours',
    tag: 'daily-reminder'
  });
  
  console.log(`✅ Notifications quotidiennes envoyées à ${subscriptions.length} utilisateurs`);
});
```

### Exemple 4 : Notification après événement externe (Webhook)

```javascript
// backend/routes/webhooks.js
import { sendPushNotificationToMany } from '../config/push.js';
import PushSubscription from '../models/PushSubscription.js';

router.post('/webhooks/payment-success', async (req, res) => {
  try {
    const { userId, amount, courseId } = req.body;
    
    // Traiter le paiement...
    
    // Envoyer une notification de confirmation
    const subscriptions = await PushSubscription.findActiveByUserId(userId);
    const pushSubscriptions = subscriptions.map(sub => sub.toPushSubscription());
    
    await sendPushNotificationToMany(pushSubscriptions, {
      title: 'Paiement confirmé ✅',
      body: `Votre paiement de ${amount}€ a été confirmé. Accédez à votre cours maintenant !`,
      icon: '/img/logo.svg',
      url: `/cours/${courseId}`,
      tag: `payment-${Date.now()}`,
      data: {
        type: 'payment',
        courseId,
        amount
      }
    });

    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});
```

---

## 🧪 Test avec cURL

### Test 1 : Envoyer une notification à l'utilisateur connecté

```bash
curl -X POST http://localhost:3000/api/push/send \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Test de notification",
    "body": "Ceci est un test de notification push",
    "icon": "/img/logo.svg",
    "url": "/"
  }'
```

### Test 2 : Envoyer une notification à un utilisateur (Admin)

```bash
curl -X POST http://localhost:3000/api/push/send-to-user/507f1f77bcf86cd799439011 \
  -H "Authorization: Bearer ADMIN_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Notification admin",
    "body": "Ceci est une notification envoyée par un admin"
  }'
```

---

## 📝 Notes importantes

1. **Authentification requise** : Toutes les routes nécessitent un token JWT valide
2. **Abonnements actifs** : Seuls les abonnements avec `isActive: true` recevront les notifications
3. **Nettoyage automatique** : Les abonnements expirés (code 410) sont automatiquement supprimés
4. **Limite de payload** : Le payload ne doit pas dépasser 4KB
5. **Tag pour éviter les doublons** : Utilisez un `tag` unique pour remplacer les notifications similaires

---

## 🔍 Dépannage

### Erreur : "Aucun abonnement actif"

L'utilisateur doit d'abord activer les notifications push depuis le frontend en cliquant sur le bouton de notifications dans le Header.

### Erreur : "Accès refusé" (route admin)

Seuls les utilisateurs avec `role: 'admin'` peuvent utiliser la route `/send-to-user/:userId`.

### Notification non reçue

1. Vérifiez que l'utilisateur a autorisé les notifications dans le navigateur
2. Vérifiez que le Service Worker est enregistré
3. Vérifiez les logs du backend pour voir les erreurs d'envoi
4. Vérifiez que les clés VAPID sont correctement configurées dans `.env`
