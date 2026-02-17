import mongoose from 'mongoose';

const fileSchema = new mongoose.Schema({
  originalName: {
    type: String,
    required: [true, 'Le nom original du fichier est requis'],
    trim: true
  },
  name: {
    type: String,
    required: [true, 'Le nom du fichier est requis'],
    trim: true
  },
  mimeType: {
    type: String,
    required: [true, 'Le type MIME est requis'],
    trim: true
  },
  size: {
    type: Number,
    required: [true, 'La taille du fichier est requise'],
    min: [0, 'La taille doit être positive']
  },
  r2Key: {
    type: String,
    required: [true, 'La clé R2 est requise'],
    unique: true,
    trim: true
  },
  url: {
    type: String,
    required: [true, 'L\'URL du fichier est requise'],
    trim: true
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'L\'utilisateur est requis'],
    index: true
  },
  folder: {
    type: String,
    default: '/',
    trim: true
  },
  createdAt: {
    type: Date,
    default: Date.now,
    index: true
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Index composé pour améliorer les performances de recherche
fileSchema.index({ user: 1, folder: 1 });
fileSchema.index({ user: 1, createdAt: -1 });

// Méthode pour obtenir les données publiques du fichier
fileSchema.methods.toPublicJSON = function() {
  return {
    id: this._id.toString(),
    originalName: this.originalName,
    name: this.name,
    mimeType: this.mimeType,
    size: this.size,
    url: this.url,
    folder: this.folder,
    createdAt: this.createdAt,
    updatedAt: this.updatedAt
  };
};

export default mongoose.model('File', fileSchema);


