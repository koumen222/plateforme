import mongoose from 'mongoose';

const partenaireSchema = new mongoose.Schema({
  nom: {
    type: String,
    required: [true, 'Nom requis'],
    trim: true
  },
  type_partenaire: {
    type: String,
    enum: ['agence_livraison', 'closeur', 'transitaire', 'autre'],
    default: 'autre'
  },
  domaine: {
    type: String,
    enum: ['livreur', 'agence_livraison', 'transitaire', 'closeur', 'fournisseur', 'autre'],
    default: 'autre'
  },
  domaines_activite: {
    type: [String],
    default: []
  },
  description_courte: {
    type: String,
    trim: true,
    default: ''
  },
  pays: {
    type: String,
    trim: true,
    default: ''
  },
  ville: {
    type: String,
    trim: true,
    default: ''
  },
  telephone: {
    type: String,
    trim: true,
    default: ''
  },
  whatsapp: {
    type: String,
    required: [true, 'WhatsApp requis'],
    trim: true
  },
  email: {
    type: String,
    trim: true,
    default: ''
  },
  lien_contact: {
    type: String,
    trim: true,
    default: ''
  },
  disponibilite: {
    type: String,
    enum: ['disponible', 'limite', 'indisponible'],
    default: 'disponible'
  },
  autorisation_affichage: {
    type: Boolean,
    default: false
  },
  statut: {
    type: String,
    enum: ['en_attente', 'approuve', 'suspendu', 'refuse'],
    default: 'en_attente'
  },
  approved_at: {
    type: Date,
    default: null
  },
  annees_experience: {
    type: Number,
    min: 0,
    default: null
  },
  zones_couvertes: {
    type: [String],
    default: []
  },
  delais_moyens: {
    type: String,
    trim: true,
    default: ''
  },
  methodes_paiement: {
    type: [String],
    default: []
  },
  langues_parlees: {
    type: [String],
    default: []
  },
  logo_url: {
    type: String,
    trim: true,
    default: ''
  },
  stats: {
    contact_count: { type: Number, default: 0 },
    response_rate: { type: Number, default: 0 },
    rating_avg: { type: Number, default: 0 },
    rating_count: { type: Number, default: 0 },
    last_contact_at: { type: Date, default: null }
  },
  monetisation: {
    plan: {
      type: String,
      enum: ['free', 'premium'],
      default: 'free'
    },
    subscription_expires_at: {
      type: Date,
      default: null
    },
    boost_until: {
      type: Date,
      default: null
    },
    leads_paid_count: {
      type: Number,
      default: 0
    }
  }
}, {
  timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' }
});

export default mongoose.model('Partenaire', partenaireSchema);
