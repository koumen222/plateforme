import mongoose from 'mongoose';

const subscriberSchema = new mongoose.Schema({
  email: {
    type: String,
    required: [true, 'Email requis'],
    unique: true,
    lowercase: true,
    trim: true,
    match: [/^\S+@\S+\.\S+$/, 'Email invalide']
  },
  name: {
    type: String,
    trim: true,
    default: ''
  },
  status: {
    type: String,
    enum: ['active', 'unsubscribed', 'bounced', 'complained'],
    default: 'active'
  },
  source: {
    type: String,
    enum: ['website', 'manual', 'import', 'api', 'sync'],
    default: 'website'
  },
  tags: [{
    type: String,
    trim: true
  }],
  metadata: {
    type: Map,
    of: String,
    default: {}
  },
  subscribedAt: {
    type: Date,
    default: Date.now
  },
  unsubscribedAt: {
    type: Date
  },
  lastEmailSentAt: {
    type: Date
  }
}, {
  timestamps: true
});

subscriberSchema.index({ email: 1 });
subscriberSchema.index({ status: 1 });
subscriberSchema.index({ subscribedAt: -1 });

export default mongoose.model('Subscriber', subscriberSchema);
