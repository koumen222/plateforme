import mongoose from 'mongoose';

const paymentTransactionSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  ebookId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Ebook',
    required: true
  },
  paymentId: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  amount: {
    type: Number,
    required: true
  },
  currency: {
    type: String,
    default: 'XAF'
  },
  phoneNumber: {
    type: String,
    required: true,
    trim: true
  },
  operator: {
    type: String,
    enum: ['CM_MTNMOBILEMONEY', 'CM_ORANGEMONEY', 'CM_EUMM', 'CM_YUP', 'CM_VISAMASTERCARD', 'CM_NEXTTELPOSSA'],
    default: null
  },
  status: {
    type: String,
    enum: ['pending', 'success', 'failed', 'cancelled'],
    default: 'pending'
  },
  monetbilStatus: {
    type: Number,
    default: null
  },
  monetbilResponse: {
    type: Map,
    of: mongoose.Schema.Types.Mixed,
    default: {}
  },
  transactionData: {
    type: Map,
    of: mongoose.Schema.Types.Mixed,
    default: {}
  },
  itemRef: {
    type: String,
    default: ''
  },
  paymentRef: {
    type: String,
    default: ''
  },
  completedAt: {
    type: Date
  }
}, {
  timestamps: true
});

paymentTransactionSchema.index({ userId: 1 });
paymentTransactionSchema.index({ ebookId: 1 });
paymentTransactionSchema.index({ paymentId: 1 });
paymentTransactionSchema.index({ status: 1 });
paymentTransactionSchema.index({ createdAt: -1 });

export default mongoose.model('PaymentTransaction', paymentTransactionSchema);
