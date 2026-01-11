import mongoose from 'mongoose';

const moduleSchema = new mongoose.Schema({
  courseId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Course',
    required: [true, 'ID du cours requis'],
    index: true
  },
  title: {
    type: String,
    required: [true, 'Titre du module requis'],
    trim: true
  },
  order: {
    type: Number,
    required: [true, 'Ordre du module requis'],
    default: 1
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

// Index pour trier par cours et ordre
moduleSchema.index({ courseId: 1, order: 1 });

export default mongoose.model('Module', moduleSchema);







