import mongoose from 'mongoose';

const workspaceSettingsSchema = new mongoose.Schema({
  workspaceId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Workspace',
    required: true,
    unique: true,
    index: true
  },
  googleSheets: {
    apiKey: { type: String, default: '' },
    spreadsheetId: { type: String, default: '' },
    sheetName: { type: String, default: 'Sheet1' },
    lastSyncAt: { type: Date },
    columnMapping: {
      orderId: { type: String, default: 'A' },
      date: { type: String, default: 'B' },
      clientName: { type: String, default: 'C' },
      clientPhone: { type: String, default: 'D' },
      city: { type: String, default: 'E' },
      product: { type: String, default: 'F' },
      quantity: { type: String, default: 'G' },
      price: { type: String, default: 'H' },
      status: { type: String, default: 'I' },
      notes: { type: String, default: 'J' }
    }
  },
  sources: [{
    name: { type: String, required: true },
    type: { type: String, enum: ['google_sheets'], default: 'google_sheets' },
    spreadsheetId: { type: String, required: true },
    sheetName: { type: String, default: 'Sheet1' },
    isActive: { type: Boolean, default: true },
    lastSyncAt: { type: Date },
    detectedHeaders: [String],
    detectedColumns: mongoose.Schema.Types.Mixed
  }],
  customWhatsAppNumber: { 
    type: String, 
    default: '',
    validate: {
      validator: function(v) {
        if (!v) return true; // Permet les valeurs vides
        // Validation pour le format 237 + chiffres
        return /^237\d{8,}$/.test(v);
      },
      message: 'Le numéro WhatsApp doit commencer par 237 suivi d\'au moins 8 chiffres'
    }
  },
  // Configuration multi-pays pour WhatsApp
  whatsappNumbers: [{
    country: { 
      type: String, 
      required: true,
      enum: ['CM', 'FR', 'CI', 'SN', 'ML', 'BF', 'NE', 'TG', 'BJ', 'GA', 'CD', 'CG', 'CA', 'US', 'GB', 'BE', 'CH', 'LU', 'MA', 'TN', 'DZ', 'EG', 'OTHER']
    },
    countryName: { type: String, required: true },
    phoneNumber: { 
      type: String, 
      required: true,
      validate: {
        validator: function(v) {
          // Validation plus flexible pour différents formats internationaux
          return /^\+\d{10,15}$/.test(v);
        },
        message: 'Le numéro WhatsApp doit être au format international (+country_code + number)'
      }
    },
    isActive: { type: Boolean, default: true },
    autoNotifyOrders: { type: Boolean, default: true },
    createdAt: { type: Date, default: Date.now }
  }],
  syncLocks: [{
    key: { type: String, required: true, index: true },
    sourceId: { type: String, required: true },
    userId: { type: mongoose.Schema.Types.ObjectId },
    createdAt: { type: Date, default: Date.now, index: true },
    expiresAt: { type: Date, required: true, index: true }
  }]
}, {
  timestamps: true,
  collection: 'ecom_workspace_settings'
});

const WorkspaceSettings = mongoose.model('WorkspaceSettings', workspaceSettingsSchema);
export default WorkspaceSettings;
