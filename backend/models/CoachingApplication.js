import mongoose from 'mongoose';

const coachingApplicationSchema = new mongoose.Schema({
  fullName: {
    type: String,
    required: [true, 'Nom et prénom requis'],
    trim: true
  },
  whatsapp: {
    type: String,
    required: [true, 'Numéro WhatsApp requis'],
    trim: true
  },
  hasProduct: {
    type: String,
    enum: ['Oui', 'Non'],
    required: [true, 'Réponse requise']
  },
  hasShopify: {
    type: String,
    enum: ['Oui', 'Non'],
    required: [true, 'Réponse requise']
  },
  hasStock: {
    type: String,
    enum: ['Oui', 'Non'],
    required: [true, 'Réponse requise']
  },
  budget: {
    type: String,
    enum: ['< 50 000 FCFA', '50 000 – 100 000 FCFA', '> 100 000 FCFA'],
    required: [true, 'Budget requis']
  },
  available7Days: {
    type: String,
    enum: ['Oui', 'Non'],
    required: [true, 'Réponse requise']
  },
  adExperience: {
    type: String,
    enum: ['Déjà lancé', 'Lancé mais pas rentable', 'Jamais lancé'],
    required: [true, 'Expérience requise']
  },
  motivation: {
    type: String,
    trim: true,
    default: ''
  },
  status: {
    type: String,
    enum: ['En attente', 'Accepté', 'Refusé'],
    default: 'En attente'
  },
  paymentLink: {
    type: String,
    trim: true,
    default: ''
  }
}, {
  timestamps: true
});

export default mongoose.model('CoachingApplication', coachingApplicationSchema);
