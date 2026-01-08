import mongoose from 'mongoose';

const winningProductSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  category: {
    type: String,
    trim: true,
    default: ''
  },
  priceRange: {
    type: String,
    trim: true,
    default: ''
  },
  countries: {
    type: [String],
    default: []
  },
  saturation: {
    type: Number,
    min: 0,
    max: 100,
    default: 0
  },
  demandScore: {
    type: Number,
    min: 0,
    max: 100,
    default: 0
  },
  trendScore: {
    type: Number,
    min: 0,
    max: 100,
    default: 0
  },
  status: {
    type: String,
    enum: ['hot', 'warm', 'dead'],
    default: 'warm'
  },
  lastUpdated: {
    type: Date,
    default: Date.now
  },
  // Champs supplémentaires du nouveau format
  problemSolved: {
    type: String,
    trim: true,
    default: ''
  },
  whyItWorks: {
    type: String,
    trim: true,
    default: ''
  },
  proofIndicator: {
    type: String,
    trim: true,
    default: ''
  },
  supplierPrice: {
    type: Number,
    default: 0
  },
  sellingPrice: {
    type: Number,
    default: 0
  },
  marketingAngle: {
    type: String,
    trim: true,
    default: ''
  },
  scalingPotential: {
    type: String,
    enum: ['Faible', 'Moyen', 'Élevé', ''],
    default: ''
  },
  alibabaLink: {
    type: String,
    trim: true,
    default: ''
  },
  specialEvent: {
    type: String,
    trim: true,
    default: '',
    enum: ['', 'saint-valentin', 'noel', 'black-friday', 'autre']
  }
}, {
  timestamps: true
});

winningProductSchema.index({ status: 1 });
winningProductSchema.index({ lastUpdated: -1 });
winningProductSchema.index({ specialEvent: 1 });

export default mongoose.model('WinningProduct', winningProductSchema);

