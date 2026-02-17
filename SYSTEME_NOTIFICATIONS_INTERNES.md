# 🔔 Système de notifications internes

Ce document décrit le système de notifications internes de l'application, qui permet d'afficher des notifications dans l'interface utilisateur.

## 📋 Vue d'ensemble

Le système de notifications internes permet de :
- Afficher des notifications dans l'interface utilisateur
- Marquer les notifications comme lues/non lues
- Supprimer des notifications
- Filtrer par type et statut
- Afficher un compteur de notifications non lues

## 🏗️ Architecture

### Backend

#### Modèle MongoDB (`backend/models/Notification.js`)

```javascript
{
  userId: ObjectId,        // Utilisateur destinataire
  type: String,           // 'comment', 'message', 'system', 'course', 'payment', 'admin'
  title: String,          // Titre de la notification
  message: String,        // Corps du message
  link: String,           // URL à ouvrir au clic (optionnel)
  icon: String,           // URL de l'icône (optionnel)
  read: Boolean,          // Statut lu/non lu
  readAt: Date,          // Date de lecture (optionnel)
  metadata: Object,      // Données supplémentaires
  createdAt: Date,        // Date de création
  updatedAt: Date        // Date de mise à jour
}
```

#### Routes API (`backend/routes/notifications.js`)

- `GET /api/notifications` - Récupérer les notifications
- `GET /api/notifications/unread-count` - Compter les non lues
- `PUT /api/notifications/:id/read` - Marquer comme lue
- `PUT /api/notifications/read-all` - Tout marquer comme lu
- `DELETE /api/notifications/:id` - Supprimer une notification
- `DELETE /api/notifications/read/all` - Supprimer toutes les lues

### Frontend

#### Contexte React (`frontend/src/contexts/NotificationsContext.jsx`)

Fournit :
- `notifications` - Liste des notifications
- `unreadCount` - Nombre de notifications non lues
- `loading` - État de chargement
- `fetchNotifications()` - Charger les notifications
- `markAsRead()` - Marquer comme lue
- `markAllAsRead()` - Tout marquer comme lu
- `deleteNotification()` - Supprimer une notification

#### Composant Dropdown (`frontend/src/components/NotificationsDropdown.jsx`)

- Affiche un bouton avec badge de compteur
- Dropdown avec liste des notifications
- Actions : marquer comme lu, supprimer, voir toutes

## 🚀 Utilisation

### Créer une notification depuis le backend

```javascript
import Notification from '../models/Notification.js';

// Créer une notification
const notification = await Notification.createNotification({
  userId: user._id,
  type: 'comment',
  title: 'Nouveau commentaire',
  message: 'Vous avez reçu un nouveau commentaire',
  link: '/commentaires',
  icon: '/img/logo.svg',
  metadata: {
    commentId: comment._id
  }
});
```

### Créer une notification depuis une route API

```javascript
// backend/routes/comments.js
import Notification from '../models/Notification.js';

router.post('/comments', async (req, res) => {
  // Créer le commentaire...
  
  // Notifier l'auteur du cours
  await Notification.createNotification({
    userId: course.authorId,
    type: 'comment',
    title: 'Nouveau commentaire',
    message: `${req.user.name} a commenté votre cours`,
    link: `/cours/${course._id}`,
    icon: '/img/logo.svg'
  });
  
  res.json({ success: true });
});
```

### Utiliser le contexte dans un composant React

```javascript
import { useNotifications } from '../contexts/NotificationsContext';

function MyComponent() {
  const { notifications, unreadCount, markAsRead } = useNotifications();
  
  return (
    <div>
      <p>Vous avez {unreadCount} notification(s) non lue(s)</p>
      {notifications.map(notif => (
        <div key={notif.id}>
          <h3>{notif.title}</h3>
          <p>{notif.message}</p>
          {!notif.read && (
            <button onClick={() => markAsRead(notif.id)}>
              Marquer comme lu
            </button>
          )}
        </div>
      ))}
    </div>
  );
}
```

## 🧪 Tests

### Créer une notification de test

```bash
cd backend
npm run create-notification user@example.com
```

Cela créera une notification de test pour l'utilisateur spécifié.

### Tester depuis le code

```javascript
// Dans n'importe quelle route backend
import Notification from '../models/Notification.js';

// Créer une notification de test
await Notification.createNotification({
  userId: req.user._id,
  type: 'system',
  title: 'Test',
  message: 'Ceci est un test'
});
```

## 📱 Interface utilisateur

### Dropdown de notifications

Le dropdown de notifications apparaît dans le Header :
- Badge avec compteur de notifications non lues
- Liste des dernières notifications
- Actions : marquer comme lu, supprimer
- Lien vers la page complète des notifications

### Types de notifications

- `comment` - Commentaires sur les cours
- `message` - Messages privés
- `system` - Notifications système
- `course` - Notifications liées aux cours
- `payment` - Notifications de paiement
- `admin` - Notifications administratives

## 🔄 Rafraîchissement automatique

Le système rafraîchit automatiquement le compteur toutes les 30 secondes pour afficher les nouvelles notifications.

## 📝 Notes importantes

1. **Authentification requise** : Toutes les routes nécessitent une authentification
2. **Limite par défaut** : 50 notifications par défaut (configurable)
3. **Tri** : Les notifications sont triées par date de création (plus récentes en premier)
4. **Nettoyage** : Les notifications lues peuvent être supprimées pour libérer de l'espace

## 🎯 Cas d'usage

### Nouveau commentaire

```javascript
await Notification.createNotification({
  userId: courseAuthor._id,
  type: 'comment',
  title: 'Nouveau commentaire',
  message: `${commenter.name} a commenté votre cours "${course.title}"`,
  link: `/cours/${course._id}`,
  metadata: { commentId: comment._id }
});
```

### Nouveau message

```javascript
await Notification.createNotification({
  userId: recipient._id,
  type: 'message',
  title: 'Nouveau message',
  message: `${sender.name} vous a envoyé un message`,
  link: `/messages/${message._id}`,
  metadata: { messageId: message._id }
});
```

### Notification système

```javascript
await Notification.createNotification({
  userId: user._id,
  type: 'system',
  title: 'Mise à jour disponible',
  message: 'Une nouvelle version de l\'application est disponible',
  link: '/nouveautes'
});
```
