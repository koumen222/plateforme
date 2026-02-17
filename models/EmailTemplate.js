import mongoose from 'mongoose';

const emailTemplateSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Nom du template requis'],
    trim: true
  },
  subject: {
    type: String,
    required: [true, 'Sujet requis'],
    trim: true
  },
  content: {
    html: {
      type: String,
      required: true
    },
    text: {
      type: String,
      default: ''
    }
  },
  category: {
    type: String,
    enum: ['newsletter', 'announcement', 'promotional', 'transactional', 'welcome', 'other'],
    default: 'newsletter'
  },
  variables: [{
    type: String,
    trim: true
  }],
  isDefault: {
    type: Boolean,
    default: false
  },
  thumbnail: {
    type: String,
    default: ''
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
}, {
  timestamps: true
});

emailTemplateSchema.index({ category: 1 });
emailTemplateSchema.index({ isDefault: 1 });

export default mongoose.model('EmailTemplate', emailTemplateSchema);
