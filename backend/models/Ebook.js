import mongoose from 'mongoose';

const ebookSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Titre requis'],
    trim: true
  },
  description: {
    type: String,
    required: [true, 'Description requise'],
    trim: true
  },
  price: {
    type: Number,
    required: [true, 'Prix requis'],
    default: 500,
    min: [0, 'Le prix doit être positif']
  },
  currency: {
    type: String,
    default: 'XAF',
    enum: ['XAF', 'USD', 'EUR']
  },
  content: {
    type: String,
    required: [true, 'Contenu requis']
  },
  coverImage: {
    type: String,
    default: ''
  },
  fileUrl: {
    type: String,
    default: ''
  },
  isActive: {
    type: Boolean,
    default: true
  },
  downloadCount: {
    type: Number,
    default: 0
  },
  purchaseCount: {
    type: Number,
    default: 0
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
}, {
  timestamps: true
});

ebookSchema.index({ isActive: 1 });
ebookSchema.index({ createdAt: -1 });

export default mongoose.model('Ebook', ebookSchema);
