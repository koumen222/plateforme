import mongoose from 'mongoose';
import crypto from 'crypto';

// ═══════════════════════════════════════════════════════════════
// MODÈLE AUDIT LOG — TRACE IMMUABLE DE TOUTE ACTION ADMIN
// ═══════════════════════════════════════════════════════════════

const auditLogSchema = new mongoose.Schema({
  // Qui a fait l'action
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  userEmail: { type: String, required: true },
  userRole: { type: String, required: true },
  userIp: { type: String, default: 'unknown' },
  
  // Quoi
  action: { type: String, required: true, enum: [
    'LOGIN', 'LOGOUT', 'LOGIN_FAILED',
    'VIEW_USERS', 'VIEW_USER_DETAIL',
    'CREATE_USER', 'UPDATE_USER', 'DELETE_USER', 'VALIDATE_USER',
    'RESET_PROGRESS', 'RESET_ALL_PROGRESS', 'CHANGE_STATUS',
    'CREATE_COURSE', 'UPDATE_COURSE', 'DELETE_COURSE',
    'CREATE_MODULE', 'UPDATE_MODULE', 'DELETE_MODULE',
    'CREATE_LESSON', 'UPDATE_LESSON', 'DELETE_LESSON',
    'UPDATE_COMMENT', 'DELETE_COMMENT',
    'UPDATE_RESERVATION', 'DELETE_RESERVATION',
    'CREATE_PARTENAIRE', 'UPDATE_PARTENAIRE', 'DELETE_PARTENAIRE',
    'SETTINGS_CHANGE', 'SECURITY_EVENT'
  ]},
  
  // Détails
  resource: { type: String }, // 'user', 'course', 'module', 'lesson', etc.
  resourceId: { type: String },
  details: { type: String, maxlength: 500 },
  
  // Contexte
  method: { type: String }, // GET, POST, PUT, DELETE
  path: { type: String },
  
  // Sécurité — hash pour empêcher la modification du log
  integrityHash: { type: String }
}, {
  collection: 'audit_logs',
  timestamps: true
});

// Empêcher la modification et suppression des logs
auditLogSchema.pre('findOneAndUpdate', function() {
  throw new Error('Les logs d\'audit ne peuvent pas être modifiés');
});
auditLogSchema.pre('findOneAndDelete', function() {
  throw new Error('Les logs d\'audit ne peuvent pas être supprimés');
});
auditLogSchema.pre('deleteOne', function() {
  throw new Error('Les logs d\'audit ne peuvent pas être supprimés');
});
auditLogSchema.pre('deleteMany', function() {
  throw new Error('Les logs d\'audit ne peuvent pas être supprimés');
});
auditLogSchema.pre('updateOne', function() {
  throw new Error('Les logs d\'audit ne peuvent pas être modifiés');
});
auditLogSchema.pre('updateMany', function() {
  throw new Error('Les logs d\'audit ne peuvent pas être modifiés');
});

// Générer un hash d'intégrité avant la sauvegarde
auditLogSchema.pre('save', function() {
  if (this.isNew) {
    const data = `${this.userId}|${this.action}|${this.createdAt || Date.now()}|${this.details || ''}`;
    this.integrityHash = crypto.createHash('sha256').update(data).digest('hex');
  }
});

auditLogSchema.index({ userId: 1, createdAt: -1 });
auditLogSchema.index({ action: 1, createdAt: -1 });
auditLogSchema.index({ resource: 1, createdAt: -1 });
auditLogSchema.index({ createdAt: -1 });

export const AuditLog = mongoose.model('AuditLog', auditLogSchema);

// Fonction helper pour créer un log
export async function logAudit(req, action, details = '', resourceType = '', resourceId = '') {
  try {
    const ip = req.headers['x-forwarded-for'] || req.socket?.remoteAddress || 'unknown';
    await AuditLog.create({
      userId: req.user?._id || req.user?.userId,
      userEmail: req.user?.email || 'unknown',
      userRole: req.user?.role || 'unknown',
      userIp: typeof ip === 'string' ? ip.split(',')[0].trim() : 'unknown',
      action,
      resource: resourceType,
      resourceId: resourceId?.toString() || '',
      details: details.substring(0, 500),
      method: req.method,
      path: req.originalUrl?.substring(0, 200)
    });
  } catch (err) {
    console.error('⚠️ Erreur audit log:', err.message);
  }
}

export default AuditLog;
