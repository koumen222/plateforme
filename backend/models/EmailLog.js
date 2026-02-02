import mongoose from 'mongoose';

const emailLogSchema = new mongoose.Schema({
  campaignId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'EmailCampaign',
    required: true
  },
  subscriberId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Subscriber'
  },
  email: {
    type: String,
    required: true,
    lowercase: true,
    trim: true
  },
  status: {
    type: String,
    enum: ['pending', 'sent', 'delivered', 'opened', 'clicked', 'bounced', 'failed', 'unsubscribed', 'complained', 'spam'],
    default: 'pending'
  },
  sentAt: {
    type: Date,
    default: Date.now
  },
  deliveredAt: {
    type: Date
  },
  openedAt: {
    type: Date
  },
  clickedAt: {
    type: Date
  },
  markedAsSpamAt: {
    type: Date
  },
  error: {
    type: String
  },
  spamReason: {
    type: String
  },
  providerResponse: {
    type: Map,
    of: mongoose.Schema.Types.Mixed,
    default: {}
  },
  tracking: {
    openToken: {
      type: String,
      unique: true,
      sparse: true
    },
    clickToken: {
      type: String,
      unique: true,
      sparse: true
    }
  },
  resendHistory: [{
    attemptedAt: { type: Date, default: Date.now },
    status: { type: String },
    error: { type: String }
  }],
  unsubscribeToken: {
    type: String,
    unique: true,
    sparse: true,
    default: null
  }
}, {
  timestamps: true
});

emailLogSchema.index({ campaignId: 1 });
emailLogSchema.index({ subscriberId: 1 });
emailLogSchema.index({ email: 1 });
emailLogSchema.index({ status: 1 });
emailLogSchema.index({ 'tracking.openToken': 1 });
emailLogSchema.index({ 'tracking.clickToken': 1 });

export default mongoose.model('EmailLog', emailLogSchema);
