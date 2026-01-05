import mongoose from 'mongoose';

const courseSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Titre du cours requis'],
    trim: true
  },
  description: {
    type: String,
    trim: true
  },
  videoId: {
    type: String,
    required: [true, 'ID vidéo requis (Vimeo)']
  },
  module: {
    type: Number,
    required: [true, 'Numéro de module requis'],
    default: 1
  },
  order: {
    type: Number,
    required: [true, 'Ordre requis'],
    default: 0
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Index pour trier par module et ordre
courseSchema.index({ module: 1, order: 1 });

export default mongoose.model('Course', courseSchema);

