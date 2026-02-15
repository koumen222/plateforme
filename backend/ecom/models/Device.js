import mongoose from 'mongoose';
import crypto from 'crypto';

const deviceSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'EcomUser',
    required: true
  },
  deviceId: {
    type: String,
    required: true,
    unique: true
  },
  deviceName: {
    type: String,
    required: true
  },
  deviceType: {
    type: String,
    enum: ['mobile', 'tablet', 'desktop', 'unknown'],
    default: 'unknown'
  },
  platform: {
    type: String,
    default: ''
  },
  userAgent: {
    type: String,
    default: ''
  },
  fingerprint: {
    type: String,
    required: true,
    unique: true
  },
  isActive: {
    type: Boolean,
    default: true
  },
  lastUsed: {
    type: Date,
    default: Date.now
  },
  trusted: {
    type: Boolean,
    default: false
  },
  location: {
    city: String,
    country: String,
    ip: String
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
}, {
  collection: 'devices',
  timestamps: true
});

// Index pour optimiser les recherches
deviceSchema.index({ userId: 1, isActive: 1 });
deviceSchema.index({ fingerprint: 1 });
deviceSchema.index({ deviceId: 1 });

// Méthode pour générer un device ID unique
deviceSchema.statics.generateDeviceId = function() {
  return 'device_' + crypto.randomBytes(16).toString('hex');
};

// Méthode pour générer un fingerprint
deviceSchema.statics.generateFingerprint = function(userAgent, ip, acceptLanguage) {
  const data = userAgent + '|' + ip + '|' + (acceptLanguage || '');
  return crypto.createHash('sha256').update(data).digest('hex');
};

// Méthode pour vérifier si un appareil est connu
deviceSchema.statics.isDeviceTrusted = async function(fingerprint, userId) {
  const device = await this.findOne({ 
    fingerprint, 
    userId, 
    isActive: true, 
    trusted: true 
  });
  return !!device;
};

// Méthode pour mettre à jour la dernière utilisation
deviceSchema.methods.updateLastUsed = function() {
  this.lastUsed = new Date();
  return this.save();
};

export default mongoose.model('Device', deviceSchema);
