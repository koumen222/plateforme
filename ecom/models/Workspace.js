import mongoose from 'mongoose';
import crypto from 'crypto';

const workspaceSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  slug: {
    type: String,
    unique: true,
    lowercase: true,
    trim: true
  },
  owner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'EcomUser',
    required: true
  },
  inviteCode: {
    type: String,
    unique: true
  },
  settings: {
    currency: { type: String, default: 'XOF' },
    businessType: { type: String, default: 'ecommerce' }
  },
  whatsappConfig: {
    phoneNumber: { type: String, default: '' },
    status: { type: String, enum: ['none', 'pending', 'active'], default: 'none' },
    requestedAt: { type: Date },
    activatedAt: { type: Date },
    note: { type: String, default: '' }
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  collection: 'ecom_workspaces',
  timestamps: true
});

// Générer slug et inviteCode avant sauvegarde
workspaceSchema.pre('save', function () {
  if (this.isNew) {
    if (!this.slug) {
      this.slug = this.name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-|-$/g, '') + '-' + Date.now().toString(36);
    }
    if (!this.inviteCode) {
      this.inviteCode = crypto.randomBytes(6).toString('hex');
    }
  }
});

// Régénérer le code d'invitation
workspaceSchema.methods.regenerateInviteCode = function () {
  this.inviteCode = crypto.randomBytes(6).toString('hex');
  return this.save();
};

workspaceSchema.index({ owner: 1 });

export default mongoose.model('EcomWorkspace', workspaceSchema);
