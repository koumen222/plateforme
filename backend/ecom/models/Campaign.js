import mongoose from 'mongoose';

const campaignSchema = new mongoose.Schema({
  workspaceId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Workspace',
    required: true,
    index: true
  },
  name: {
    type: String,
    required: true,
    trim: true
  },
  type: {
    type: String,
    enum: ['relance_pending', 'relance_cancelled', 'promo', 'followup', 'custom'],
    default: 'custom'
  },
  status: {
    type: String,
    enum: ['draft', 'scheduled', 'sending', 'sent', 'paused', 'failed'],
    default: 'draft'
  },
  // Filtres pour cibler les clients
  targetFilters: {
    clientStatus: { type: String, default: '' },
    city: { type: String, default: '' },
    product: { type: String, default: '' },
    tag: { type: String, default: '' },
    minOrders: { type: Number, default: 0 },
    maxOrders: { type: Number, default: 0 },
    lastContactBefore: { type: Date }
  },
  // Template du message WhatsApp
  messageTemplate: {
    type: String,
    required: true,
    trim: true
  },
  // Variables disponibles: {firstName}, {lastName}, {phone}, {city}, {product}, {totalOrders}, {totalSpent}
  // Programmation
  scheduledAt: {
    type: Date
  },
  sentAt: {
    type: Date
  },
  // Statistiques
  stats: {
    targeted: { type: Number, default: 0 },
    sent: { type: Number, default: 0 },
    failed: { type: Number, default: 0 }
  },
  // Résultats détaillés
  results: [{
    clientId: { type: mongoose.Schema.Types.ObjectId, ref: 'Client' },
    clientName: String,
    phone: String,
    status: { type: String, enum: ['pending', 'sent', 'failed'], default: 'pending' },
    error: String,
    sentAt: Date
  }],
  tags: [{
    type: String,
    trim: true
  }],
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'EcomUser',
    required: true
  }
}, {
  timestamps: true,
  collection: 'ecom_campaigns'
});

campaignSchema.index({ workspaceId: 1, status: 1 });
campaignSchema.index({ workspaceId: 1, createdAt: -1 });
campaignSchema.index({ workspaceId: 1, scheduledAt: 1 });

const Campaign = mongoose.model('Campaign', campaignSchema);
export default Campaign;
