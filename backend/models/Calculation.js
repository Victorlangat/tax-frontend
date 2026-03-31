const mongoose = require('mongoose');

const calculationSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  vehicle: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Vehicle',
    required: true
  },
  crsp: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'CRSP'
  },
  referenceId: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  name: {
    type: String,
    trim: true
  },
  description: {
    type: String,
    trim: true
  },
  inputs: {
    vehicleValue: { type: Number, required: true },
    shippingCost: { type: Number, default: 0 },
    insuranceCost: { type: Number, default: 0 },
    additionalCosts: { type: Number, default: 0 },
    cifValue: { type: Number, required: true },
    age: { type: Number },
    fuelType: { type: String },
    engineCC: { type: Number }
  },
  results: {
    customsValue: { type: Number, required: true },
    depreciationFactor: { type: Number, required: true },
    importDuty: { type: Number, required: true },
    exciseDuty: { type: Number, required: true },
    vat: { type: Number, required: true },
    idf: { type: Number, required: true },
    rdl: { type: Number, required: true },
    totalTax: { type: Number, required: true },
    totalCost: { type: Number, required: true }
  },
  rates: {
    importDuty: { type: Number, required: true },
    exciseDuty: { type: Number, required: true },
    vat: { type: Number, required: true },
    idf: { type: Number, required: true },
    rdl: { type: Number, required: true }
  },
  summary: {
    taxToValueRatio: { type: Number, required: true },
    totalTaxPercentage: { type: Number, required: true },
    notes: { type: String }
  },
  status: {
    type: String,
    enum: ['draft', 'calculated', 'saved', 'exported', 'submitted'],
    default: 'calculated'
  },
  isSaved: {
    type: Boolean,
    default: false
  },
  savedAt: {
    type: Date
  },
  tags: [{
    type: String,
    trim: true
  }],
  notes: {
    type: String,
    trim: true
  },
  attachments: [{
    filename: String,
    url: String,
    type: String,
    size: Number,
    uploadedAt: { type: Date, default: Date.now }
  }],
  sharing: {
    isShared: { type: Boolean, default: false },
    sharedWith: [{
      user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
      permission: { type: String, enum: ['view', 'edit'], default: 'view' },
      sharedAt: { type: Date, default: Date.now }
    }],
    shareToken: String,
    shareExpires: Date
  },
  metadata: {
    ipAddress: String,
    userAgent: String,
    calculationTime: { type: Number } // in milliseconds
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes for efficient querying
calculationSchema.index({ user: 1, createdAt: -1 });
calculationSchema.index({ referenceId: 1 });
calculationSchema.index({ vehicle: 1 });
calculationSchema.index({ status: 1 });
calculationSchema.index({ 'sharing.sharedWith': 1 });
calculationSchema.index({ tags: 1 });

// Virtual for formatted vehicle name
calculationSchema.virtual('formattedVehicle').get(function() {
  if (this.vehicle && typeof this.vehicle === 'object') {
    const vehicle = this.vehicle;
    return `${vehicle.year} ${vehicle.make} ${vehicle.model} ${vehicle.trim || ''}`.trim();
  }
  return '';
});

// Virtual for calculation age in days
calculationSchema.virtual('ageInDays').get(function() {
  const now = new Date();
  const created = new Date(this.createdAt);
  const diffTime = Math.abs(now - created);
  return Math.floor(diffTime / (1000 * 60 * 60 * 24));
});

// Pre-save middleware to generate reference ID and calculate summary
calculationSchema.pre('save', function(next) {
  if (!this.referenceId) {
    const timestamp = Date.now().toString();
    const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
    this.referenceId = `CALC-${timestamp.slice(-8)}-${random}`;
  }
  
  // Auto-generate name if not provided
  if (!this.name && this.vehicle && this.vehicle.make && this.vehicle.model) {
    this.name = `${this.vehicle.make} ${this.vehicle.model} Tax Calculation`;
  }
  
  // Ensure status is updated when saved
  if (this.isSaved && !this.savedAt) {
    this.savedAt = new Date();
    this.status = 'saved';
  }
  
  next();
});

// Method to get calculation breakdown for display
calculationSchema.methods.getBreakdown = function() {
  return {
    inputs: this.inputs,
    results: this.results,
    rates: this.rates,
    summary: this.summary
  };
};

// Static method to find calculations by date range
calculationSchema.statics.findByDateRange = function(userId, startDate, endDate) {
  return this.find({
    user: userId,
    createdAt: {
      $gte: new Date(startDate),
      $lte: new Date(endDate)
    }
  }).sort({ createdAt: -1 });
};

module.exports = mongoose.model('Calculation', calculationSchema);