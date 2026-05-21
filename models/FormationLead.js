import mongoose from 'mongoose';

const campaignMessageSchema = new mongoose.Schema({
  day: Number,
  sentAt: Date,
  status: { type: String, enum: ['sent', 'failed'], default: 'sent' },
}, { _id: false });

const formationLeadSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  phone: { type: String, required: true, trim: true },
  email: { type: String, trim: true, lowercase: true, default: '' },
  source: { type: String, default: 'formation-gratuite' },
  ipAddress: { type: String, default: '' },
  campaign: {
    active: { type: Boolean, default: true },
    messagesSent: { type: [campaignMessageSchema], default: [] },
    unsubscribedAt: { type: Date, default: null },
  },
}, { timestamps: true });

formationLeadSchema.index({ createdAt: -1 });
formationLeadSchema.index({ phone: 1 });
formationLeadSchema.index({ 'campaign.active': 1 });

export default mongoose.model('FormationLead', formationLeadSchema);
