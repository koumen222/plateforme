import mongoose from 'mongoose';

const partenaireAvisSchema = new mongoose.Schema({
  partenaire_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Partenaire',
    required: true
  },
  note: {
    type: Number,
    min: 1,
    max: 5,
    required: true
  },
  commentaire: {
    type: String,
    trim: true,
    default: ''
  },
  recommande: {
    type: Boolean,
    default: false
  },
  auteur_nom: {
    type: String,
    trim: true,
    default: ''
  },
  auteur_email: {
    type: String,
    trim: true,
    default: ''
  },
  statut: {
    type: String,
    enum: ['en_attente', 'approuve', 'refuse'],
    default: 'en_attente'
  }
}, {
  timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' }
});

export default mongoose.model('PartenaireAvis', partenaireAvisSchema);
