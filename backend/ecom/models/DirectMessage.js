import mongoose from 'mongoose';

const directMessageSchema = new mongoose.Schema({
  workspaceId: { type: mongoose.Schema.Types.ObjectId, ref: 'EcomWorkspace', required: true, index: true },
  participants: [{ type: mongoose.Schema.Types.ObjectId, ref: 'EcomUser', required: true }],
  senderId: { type: mongoose.Schema.Types.ObjectId, ref: 'EcomUser', required: true },
  senderName: { type: String, required: true },
  senderRole: { type: String, required: true },
  content: { type: String, required: true, maxlength: 2000, trim: true },
  readBy: [{
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'EcomUser' },
    readAt: { type: Date, default: Date.now }
  }],
  edited: { type: Boolean, default: false },
  deleted: { type: Boolean, default: false }
}, { timestamps: true, collection: 'ecom_direct_messages' });

directMessageSchema.index({ workspaceId: 1, participants: 1, createdAt: -1 });
directMessageSchema.index({ senderId: 1, createdAt: -1 });

export default mongoose.model('EcomDirectMessage', directMessageSchema);
