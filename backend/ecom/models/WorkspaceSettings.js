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
  }
}, {
  timestamps: true,
  collection: 'ecom_workspace_settings'
});

const WorkspaceSettings = mongoose.model('WorkspaceSettings', workspaceSettingsSchema);
export default WorkspaceSettings;
