import mongoose from 'mongoose';

const partenaireContactSchema = new mongoose.Schema({
  partenaire_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Partenaire',
    required: true
  },
  type: {
    type: String,
    enum: ['whatsapp', 'appel', 'plateforme'],
    required: true
  },
  message: {
    type: String,
    trim: true,
    default: ''
  }
}, {
  timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' }
});

export default mongoose.model('PartenaireContact', partenaireContactSchema);
