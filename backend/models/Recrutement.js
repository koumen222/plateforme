import mongoose from 'mongoose';

const recrutementSchema = new mongoose.Schema({
  nom: {
    type: String,
    required: [true, 'Nom requis'],
    trim: true
  },
  type: {
    type: String,
    enum: ['livreur', 'societe_livraison', 'transitaire', 'closeur', 'fournisseur', 'autre'],
    default: 'autre'
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
  whatsapp: {
    type: String,
    required: [true, 'WhatsApp requis'],
    trim: true
  },
  lien_contact: {
    type: String,
    trim: true,
    default: ''
  },
  autorisation_affichage: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' }
});

export default mongoose.model('Recrutement', recrutementSchema);
