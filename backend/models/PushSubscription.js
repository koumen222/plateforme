import mongoose from 'mongoose';

/**
 * Schéma MongoDB pour stocker les abonnements push web
 * 
 * Un utilisateur peut avoir plusieurs abonnements (différents navigateurs/appareils)
 * Chaque abonnement est unique et identifié par son endpoint
 */
const pushSubscriptionSchema = new mongoose.Schema({
  // Référence vers l'utilisateur propriétaire de l'abonnement
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'L\'ID utilisateur est requis'],
    index: true // Index pour les recherches rapides par utilisateur
  },
  
  // Endpoint unique du service push (FCM, Mozilla, etc.)
  // Format: https://fcm.googleapis.com/fcm/send/... ou https://updates.push.services.mozilla.com/...
  endpoint: {
    type: String,
    required: [true, 'L\'endpoint est requis'],
    unique: true, // Un endpoint ne peut être utilisé qu'une seule fois
    trim: true,
    index: true // Index pour les recherches rapides par endpoint
  },
  
  // Clé publique de chiffrement (p256dh)
  // Utilisée pour chiffrer les données de la notification
  p256dh: {
    type: String,
    required: [true, 'La clé p256dh est requise'],
    trim: true
  },
  
  // Clé d'authentification (auth)
  // Utilisée pour authentifier les notifications
  auth: {
    type: String,
    required: [true, 'La clé auth est requise'],
    trim: true
  },
  
  // Informations optionnelles sur l'appareil/navigateur
  deviceInfo: {
    type: String,
    trim: true,
    default: null
    // Exemple: "Chrome on Windows", "Firefox on Android", etc.
  },
  
  // User-Agent du navigateur (optionnel)
  userAgent: {
    type: String,
    trim: true,
    default: null
  },
  
  // Statut de l'abonnement
  // Permet de désactiver un abonnement sans le supprimer
  isActive: {
    type: Boolean,
    default: true,
    index: true // Index pour filtrer les abonnements actifs
  },
  
  // Date de dernière utilisation (pour nettoyer les abonnements inactifs)
  lastUsedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true // Mongoose gère automatiquement createdAt et updatedAt
});

// Index composé pour optimiser les requêtes fréquentes
// Recherche des abonnements actifs d'un utilisateur
pushSubscriptionSchema.index({ userId: 1, isActive: 1 });

// Index pour nettoyer les anciens abonnements
pushSubscriptionSchema.index({ lastUsedAt: 1 });

/**
 * Méthode pour convertir l'abonnement au format attendu par web-push
 * Retourne l'objet dans le format PushSubscription standard
 */
pushSubscriptionSchema.methods.toPushSubscription = function() {
  return {
    endpoint: this.endpoint,
    keys: {
      p256dh: this.p256dh,
      auth: this.auth
    }
  };
};

/**
 * Méthode statique pour trouver tous les abonnements actifs d'un utilisateur
 */
pushSubscriptionSchema.statics.findActiveByUserId = function(userId) {
  return this.find({ userId, isActive: true });
};

/**
 * Méthode statique pour trouver un abonnement par endpoint
 */
pushSubscriptionSchema.statics.findByEndpoint = function(endpoint) {
  return this.findOne({ endpoint });
};

/**
 * Méthode pour désactiver un abonnement (au lieu de le supprimer)
 */
pushSubscriptionSchema.methods.deactivate = function() {
  this.isActive = false;
  return this.save();
};

/**
 * Méthode pour mettre à jour la date de dernière utilisation
 */
pushSubscriptionSchema.methods.updateLastUsed = function() {
  this.lastUsedAt = new Date();
  return this.save();
};

export default mongoose.model('PushSubscription', pushSubscriptionSchema);
