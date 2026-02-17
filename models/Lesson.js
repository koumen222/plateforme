import mongoose from 'mongoose';

const lessonSchema = new mongoose.Schema({
  moduleId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Module',
    required: [true, 'ID du module requis'],
    index: true
  },
  title: {
    type: String,
    required: [true, 'Titre de la leçon requis'],
    trim: true
  },
  videoId: {
    type: String,
    required: [true, 'ID vidéo requis (Vimeo)'],
    trim: true
  },
  videoType: {
    type: String,
    enum: ['youtube', 'vimeo'],
    default: 'vimeo'
  },
  order: {
    type: Number,
    required: [true, 'Ordre de la leçon requis'],
    default: 1
  },
  locked: {
    type: Boolean,
    default: true
  },
  isCoaching: {
    type: Boolean,
    default: false
  },
  summary: {
    text: {
      type: String,
      trim: true,
      default: ''
    },
    points: [{
      type: String,
      trim: true
    }]
  },
  // Resources accept array of objects (icon, title, type, link, download)
  // Using Mixed to avoid cast issues if shape evolves
  resources: {
    type: [mongoose.Schema.Types.Mixed],
    default: []
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

// Index pour trier par module et ordre
lessonSchema.index({ moduleId: 1, order: 1 });

export default mongoose.model('Lesson', lessonSchema);

