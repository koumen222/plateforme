import mongoose from 'mongoose';

const emailCampaignSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Nom de la campagne requis'],
    trim: true
  },
  subject: {
    type: String,
    required: [true, 'Sujet requis'],
    trim: true
  },
  templateId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'EmailTemplate'
  },
  content: {
    html: {
      type: String,
      required: true
    },
    text: {
      type: String,
      default: ''
    }
  },
  recipients: {
    type: {
      type: String,
      enum: ['all', 'segment', 'list'],
      default: 'all'
    },
    segment: {
      type: String,
      enum: ['active', 'unsubscribed', 'bounced', 'custom'],
      default: 'active'
    },
    customEmails: [{
      type: String,
      lowercase: true,
      trim: true
    }],
    count: {
      type: Number,
      default: 0
    }
  },
  status: {
    type: String,
    enum: ['draft', 'scheduled', 'sending', 'sent', 'paused', 'cancelled'],
    default: 'draft'
  },
  scheduledAt: {
    type: Date
  },
  sentAt: {
    type: Date
  },
  stats: {
    sent: {
      type: Number,
      default: 0
    },
    delivered: {
      type: Number,
      default: 0
    },
    opened: {
      type: Number,
      default: 0
    },
    clicked: {
      type: Number,
      default: 0
    },
    bounced: {
      type: Number,
      default: 0
    },
    unsubscribed: {
      type: Number,
      default: 0
    },
    complained: {
      type: Number,
      default: 0
    }
  },
  fromEmail: {
    type: String,
    default: process.env.EMAIL_FROM || 'contact@infomania.store'
  },
  fromName: {
    type: String,
    default: 'Infomania'
  },
  replyTo: {
    type: String,
    default: process.env.EMAIL_REPLY_TO || 'contact@infomania.store'
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
}, {
  timestamps: true
});

emailCampaignSchema.index({ status: 1 });
emailCampaignSchema.index({ scheduledAt: 1 });
emailCampaignSchema.index({ createdAt: -1 });

export default mongoose.model('EmailCampaign', emailCampaignSchema);
