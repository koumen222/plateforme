import mongoose from 'mongoose';

const whatsappCampaignSchema = new mongoose.Schema({
  name: {
    type: String,
    trim: true,
    default: function() {
      return `Newsletter ${new Date().toLocaleDateString('fr-FR')} ${new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}`;
    }
  },
  message: {
    type: String,
    trim: true
  },
  variants: {
    type: [String],
    default: [],
    validate: {
      validator: function(v) {
        // Au moins un message ou une variante doit être fourni
        return (this.message && this.message.trim()) || (v && v.length > 0);
      },
      message: 'Au moins un message ou une variante doit être fourni'
    }
  },
  recipients: {
    type: {
      type: String,
      enum: ['all', 'segment', 'list'],
      required: true
    },
    segment: String,
    customPhones: [String],
    count: Number
  },
  scheduledAt: {
    type: Date
  },
  status: {
    type: String,
    enum: ['draft', 'scheduled', 'sending', 'sent', 'failed'],
    default: 'draft'
  },
  sentAt: {
    type: Date
  },
  stats: {
    sent: { type: Number, default: 0 },
    failed: { type: Number, default: 0 },
    delivered: { type: Number, default: 0 },
    read: { type: Number, default: 0 }
  },
  error: {
    type: String
  },
  fromPhone: {
    type: String,
    default: process.env.WHATSAPP_FROM_PHONE || ''
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  }
}, {
  timestamps: true
});

whatsappCampaignSchema.index({ status: 1 });
whatsappCampaignSchema.index({ scheduledAt: 1 });
whatsappCampaignSchema.index({ createdBy: 1 });

export default mongoose.model('WhatsAppCampaign', whatsappCampaignSchema);
