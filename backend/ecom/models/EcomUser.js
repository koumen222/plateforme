import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const ecomUserSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true
  },
  password: {
    type: String,
    required: true,
    minlength: 6
  },
  role: {
    type: String,
    enum: ['super_admin', 'ecom_admin', 'ecom_closeuse', 'ecom_compta'],
    default: 'ecom_closeuse'
  },
  workspaceId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'EcomWorkspace',
    default: null
  },
  isActive: {
    type: Boolean,
    default: true
  },
  lastLogin: {
    type: Date
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
}, {
  collection: 'ecom_users',
  timestamps: true
});

// Hash password avant sauvegarde
ecomUserSchema.pre('save', async function() {
  if (!this.isModified('password')) return;
  
  try {
    const salt = await bcrypt.genSalt(12);
    this.password = await bcrypt.hash(this.password, salt);
  } catch (error) {
    throw error;
  }
});

// Méthode de vérification du mot de passe
ecomUserSchema.methods.comparePassword = async function(candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

// Méthode pour obtenir les permissions
ecomUserSchema.methods.getPermissions = function() {
  const permissions = {
    super_admin: ['admin:read', 'admin:write'],
    ecom_admin: ['*'],
    ecom_closeuse: ['orders:read', 'orders:write'],
    ecom_compta: ['finance:read']
  };
  
  return permissions[this.role] || [];
};

// Méthode pour vérifier une permission spécifique
ecomUserSchema.methods.hasPermission = function(permission) {
  const userPermissions = this.getPermissions();
  return userPermissions.includes('*') || userPermissions.includes(permission);
};

export default mongoose.model('EcomUser', ecomUserSchema);
