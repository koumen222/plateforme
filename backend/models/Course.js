import mongoose from 'mongoose';

const courseSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Titre du cours requis'],
    trim: true
  },
  description: {
    type: String,
    trim: true,
    default: ''
  },
  coverImage: {
    type: String,
    trim: true,
    default: '/img/fbads.png'
  },
  slug: {
    type: String,
    required: [true, 'Slug du cours requis'],
    unique: true,
    trim: true,
    lowercase: true,
    match: [/^[a-z0-9-]+$/, 'Le slug ne peut contenir que des lettres minuscules, chiffres et tirets']
  },
  isDefault: {
    type: Boolean,
    default: false
  },
  isPublished: {
    // Si false => n'apparait pas sur la home
    type: Boolean,
    default: false
  },
  isFree: {
    type: Boolean,
    default: false
  },
  isFree: {
    // Si true => accès gratuit pour les utilisateurs inscrits (même pending)
    type: Boolean,
    default: false
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Index pour le cours par défaut
courseSchema.index({ isDefault: 1 });
courseSchema.index({ isPublished: 1 });

export default mongoose.model('Course', courseSchema);
