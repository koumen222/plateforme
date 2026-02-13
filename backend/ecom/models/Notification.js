import mongoose from 'mongoose';

const notificationSchema = new mongoose.Schema({
  workspaceId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Workspace',
    required: true,
    index: true
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'EcomUser',
    default: null,
    index: true
  },
  type: {
    type: String,
    enum: [
      'order_new',
      'order_status',
      'order_confirmed',
      'order_shipped',
      'order_delivered',
      'order_cancelled',
      'order_returned',
      'stock_low',
      'stock_out',
      'stock_received',
      'report_created',
      'user_joined',
      'user_role_changed',
      'decision_created',
      'decision_overdue',
      'goal_achieved',
      'goal_missed',
      'campaign_sent',
      'import_completed',
      'system',
      'info'
    ],
    required: true,
    index: true
  },
  title: {
    type: String,
    required: true,
    maxlength: 200
  },
  message: {
    type: String,
    required: true,
    maxlength: 500
  },
  icon: {
    type: String,
    default: 'info'
  },
  link: {
    type: String,
    default: null
  },
  read: {
    type: Boolean,
    default: false,
    index: true
  },
  readAt: {
    type: Date,
    default: null
  },
  metadata: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  }
}, {
  timestamps: true
});

notificationSchema.index({ workspaceId: 1, read: 1, createdAt: -1 });
notificationSchema.index({ userId: 1, read: 1, createdAt: -1 });
notificationSchema.index({ createdAt: 1 }, { expireAfterSeconds: 60 * 60 * 24 * 30 });

const Notification = mongoose.model('EcomNotification', notificationSchema);

export default Notification;
