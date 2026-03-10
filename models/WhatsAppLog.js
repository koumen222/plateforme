import mongoose from 'mongoose';

const whatsappLogSchema = new mongoose.Schema({
  campaignId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'WhatsAppCampaign',
    required: true
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  phone: {
    type: String,
    required: true,
    trim: true
  },
  firstName: {
    type: String,
    trim: true
  },
  messageSent: {
    type: String,
    trim: true
  },
  status: {
    type: String,
    enum: ['pending', 'sent', 'delivered', 'read', 'failed', 'undelivered'],
    default: 'pending'
  },
  sentAt: {
    type: Date,
    default: Date.now
  },
  deliveredAt: {
    type: Date
  },
  readAt: {
    type: Date
  },
  error: {
    type: String
  },
  providerResponse: {
    type: Map,
    of: mongoose.Schema.Types.Mixed,
    default: {}
  },
  messageId: {
    type: String
  }
}, {
  timestamps: true
});

whatsappLogSchema.index({ campaignId: 1 });
whatsappLogSchema.index({ userId: 1 });
whatsappLogSchema.index({ phone: 1 });
whatsappLogSchema.index({ status: 1 });
whatsappLogSchema.index({ messageId: 1 });

export default mongoose.model('WhatsAppLog', whatsappLogSchema);
