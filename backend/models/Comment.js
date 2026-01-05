import mongoose from 'mongoose';

const commentSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  userEmail: {
    type: String,
    required: true
  },
  content: {
    type: String,
    required: [true, 'Le contenu du commentaire est requis'],
    trim: true,
    maxlength: [2000, 'Le commentaire ne peut pas dépasser 2000 caractères']
  },
  lessonId: {
    type: Number,
    required: false // Optionnel, pour lier un commentaire à une leçon spécifique
  },
  lessonTitle: {
    type: String,
    required: false
  },
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected'],
    default: 'pending'
  },
  adminResponse: {
    type: String,
    trim: true,
    default: null
  },
  userResponse: {
    type: String,
    trim: true,
    default: null
  }
}, {
  timestamps: true // Mongoose gère automatiquement createdAt et updatedAt
});

export default mongoose.model('Comment', commentSchema);

