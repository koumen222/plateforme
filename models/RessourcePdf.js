import mongoose from 'mongoose';

const ressourcePdfSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Titre de la ressource PDF requis'],
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
    default: '/img/ressource-pdf-default.png'
  },
  pdfUrl: {
    type: String,
    required: [true, 'URL du PDF requis'],
    trim: true
  },
  slug: {
    type: String,
    required: [true, 'Slug de la ressource PDF requis'],
    unique: true,
    trim: true,
    lowercase: true,
    match: [/^[a-z0-9-]+$/, 'Le slug ne peut contenir que des lettres minuscules, chiffres et tirets']
  },
  category: {
    type: String,
    trim: true,
    default: 'Général'
  },
  author: {
    type: String,
    trim: true,
    default: 'Ecom Starter'
  },
  pages: {
    type: Number,
    default: 0
  },
  price: {
    type: Number,
    default: 0,
    min: 0
  },
  isFree: {
    type: Boolean,
    default: false
  },
  isPublished: {
    type: Boolean,
    default: false
  },
  downloadCount: {
    type: Number,
    default: 0
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

// Index pour les ressources PDF publiées
ressourcePdfSchema.index({ isPublished: 1 });
ressourcePdfSchema.index({ category: 1 });
ressourcePdfSchema.index({ createdAt: -1 });

export default mongoose.model('RessourcePdf', ressourcePdfSchema);

