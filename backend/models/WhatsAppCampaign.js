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
    customPhones: {
      type: [String],
      validate: {
        validator: function(v) {
          // Validation uniquement pour le type 'list'
          if (this.recipients.type === 'list') {
            if (!v || v.length === 0) return false;
            
            // Fonction de normalisation pour validation
            const normalizePhone = (phone) => {
              if (!phone) return '';
              let cleaned = phone.toString().replace(/\D/g, '').trim();
              
              // ✅ 2️⃣ Corriger le cas 00237699887766
              if (cleaned.startsWith('00')) {
                cleaned = cleaned.substring(2); // Enlever les "00"
              }
              
              // Gérer le préfixe pays (Cameroun 237)
              if (cleaned.length === 9 && cleaned.startsWith('6')) {
                return '237' + cleaned;
              }
              
              return cleaned;
            };
            
            // Valider et normaliser les numéros
            const validPhones = v
              .map(phone => normalizePhone(phone))
              .filter(phone => phone.length >= 8); // Minimum 8 digits
            
            return validPhones.length > 0;
          }
          return true; // Pas de validation pour les autres types
        },
        message: 'customPhones doit contenir au moins un numéro valide (8 chiffres minimum) pour le type "list"'
      }
    },
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
