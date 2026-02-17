import mongoose from 'mongoose';

const visitSchema = new mongoose.Schema({
  ip: {
    type: String,
    required: true,
    index: true
  },
  country: {
    type: String,
    required: true,
    index: true
  },
  countryCode: {
    type: String,
    index: true
  },
  city: {
    type: String
  },
  region: {
    type: String
  },
  userAgent: {
    type: String
  },
  referrer: {
    type: String
  },
  path: {
    type: String,
    index: true
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  sessionId: {
    type: String,
    index: true
  },
  createdAt: {
    type: Date,
    default: Date.now,
    index: true
  }
}, {
  timestamps: true
});

// Index composé pour les requêtes de statistiques
visitSchema.index({ country: 1, createdAt: -1 });
visitSchema.index({ createdAt: -1 });

const Visit = mongoose.model('Visit', visitSchema);

export default Visit;
