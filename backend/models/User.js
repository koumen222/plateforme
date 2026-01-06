import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Le nom est requis'],
    trim: true,
    minlength: [2, 'Le nom doit contenir au moins 2 caractères']
  },
  email: {
    type: String,
    required: [true, 'Email est requis'],
    unique: true,
    lowercase: true,
    trim: true,
    match: [/^\S+@\S+\.\S+$/, 'Email invalide']
  },
  phoneNumber: {
    type: String,
    required: function () {
      return this.authProvider === "local";
    },
    unique: true,
    sparse: true, // Permet plusieurs null (obligatoire pour Google OAuth)
    trim: true,
    match: [/^[\d\s\-\+\(\)]+$/, 'Numéro de téléphone invalide']
  },
  password: {
    type: String,
    required: function () {
      return this.authProvider === "local";
    },
    minlength: 6
  },
  googleId: {
    type: String,
    unique: true,
    sparse: true
  },
  authProvider: {
    type: String,
    enum: ['local', 'google'],
    required: true
  },
  role: {
    type: String,
    enum: ['student', 'superadmin'],
    default: 'student'
  },
  status: {
    type: String,
    enum: ['pending', 'active', 'inactive'],
    default: 'pending'
  },
  progress: [{
    courseId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Course'
    },
    completed: {
      type: Boolean,
      default: false
    },
    completedAt: {
      type: Date,
      default: null
    }
  }],
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Hook pre-validate : définir authProvider par défaut si absent (pour compatibilité avec anciens utilisateurs)
userSchema.pre('validate', function(next) {
  // Si authProvider n'est pas défini, le définir selon les données disponibles
  if (!this.authProvider) {
    if (this.googleId) {
      this.authProvider = 'google';
    } else {
      this.authProvider = 'local';
    }
  }
  next();
});

// Hash du mot de passe avant sauvegarde
userSchema.pre('save', async function() {
  // Si le mot de passe n'a pas été modifié ou n'existe pas, ne rien faire
  if (!this.isModified('password') || !this.password) {
    return;
  }
  
  // Hasher le mot de passe
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
});

// Méthode pour comparer les mots de passe
userSchema.methods.comparePassword = async function(candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

export default mongoose.model('User', userSchema);

