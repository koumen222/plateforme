import mongoose from 'mongoose';

const orderSchema = new mongoose.Schema({
  workspaceId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Workspace',
    required: true,
    index: true
  },
  sheetRowId: {
    type: String,
    default: ''
  },
  orderId: {
    type: String,
    default: ''
  },
  date: {
    type: Date
  },
  clientName: {
    type: String,
    trim: true,
    default: ''
  },
  clientPhone: {
    type: String,
    trim: true,
    default: ''
  },
  city: {
    type: String,
    trim: true,
    default: ''
  },
  address: {
    type: String,
    trim: true,
    default: ''
  },
  product: {
    type: String,
    trim: true,
    default: ''
  },
  quantity: {
    type: Number,
    default: 1
  },
  price: {
    type: Number,
    default: 0
  },
  status: {
    type: String,
    default: 'pending'
  },
  deliveryLocation: {
    type: String,
    trim: true,
    default: ''
  },
  deliveryTime: {
    type: String,
    trim: true,
    default: ''
  },
  tags: {
    type: [String],
    default: []
  },
  assignedLivreur: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'EcomUser',
    default: null
  },
  notes: {
    type: String,
    trim: true,
    default: ''
  },
  source: {
    type: String,
    enum: ['google_sheets', 'manual'],
    default: 'manual'
  },
  rawData: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  },
  whatsappNotificationSent: {
    type: Boolean,
    default: false
  },
  whatsappNotificationSentAt: {
    type: Date,
    default: null
  },
  statusModifiedManually: {
    type: Boolean,
    default: false
  },
  lastManualStatusUpdate: {
    type: Date,
    default: null
  }
}, {
  timestamps: true,
  collection: 'ecom_orders'
});

orderSchema.index({ workspaceId: 1, orderId: 1 });
orderSchema.index({ workspaceId: 1, sheetRowId: 1 }, { unique: true, sparse: true });
orderSchema.index({ workspaceId: 1, status: 1 });
orderSchema.index({ workspaceId: 1, date: -1 });
orderSchema.index({ workspaceId: 1, updatedAt: -1 });

const Order = mongoose.model('Order', orderSchema);
export default Order;
