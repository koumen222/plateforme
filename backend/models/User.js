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
  phone: {
    type: String,
    trim: true,
    sparse: true,
    match: [/^[\d\s\-\+\(\)]+$/, 'Numéro de téléphone invalide']
  },
  phoneNumber: {
    type: String,
    trim: true,
    sparse: true,
    match: [/^[\d\s\-\+\(\)]+$/, 'Numéro de téléphone invalide']
  },
  password: {
    type: String,
    minlength: 6,
    select: false
  },
  role: {
    type: String,
    enum: ['student', 'admin', 'superadmin'],
    default: 'student'
  },
  status: {
    type: String,
    enum: ['pending', 'active', 'blocked'],
    default: 'pending'
  },
  authProvider: {
    type: String,
    enum: ['local', 'google'],
    default: 'local'
  },
  googleId: {
    type: String,
    unique: true,
    sparse: true
  },
  emailVerified: {
    type: Boolean,
    default: false
  },
  accountStatus: {
    type: String,
    enum: ['pending', 'active', 'blocked'],
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
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Hash automatique du mot de passe avant sauvegarde
// Version compatible avec toutes les versions de Mongoose
userSchema.pre('save', function() {
  // Ne hasher que si le mot de passe a été modifié et qu'il existe
  if (!this.isModified('password') || !this.password) {
    return;
  }

  // Hasher le mot de passe de manière synchrone pour éviter les problèmes avec next()
  const salt = bcrypt.genSaltSync(10);
  this.password = bcrypt.hashSync(this.password, salt);
});

// Méthode pour comparer les mots de passe
userSchema.methods.comparePassword = async function(candidatePassword) {
  if (!this.password) {
    return false;
  }
  return await bcrypt.compare(candidatePassword, this.password);
};

// Méthode pour obtenir les données publiques de l'utilisateur
userSchema.methods.toPublicJSON = function() {
  const userObject = this.toObject();
  delete userObject.password;
  return userObject;
};

export default mongoose.model('User', userSchema);
