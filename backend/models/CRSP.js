const mongoose = require('mongoose');

const CRSPSchema = new mongoose.Schema({
  // Embedded vehicle details (for when Vehicle ref is not available)
  vehicleDetails: {
    make: { type: String, default: '' },
    model: { type: String, default: '' },
    year: { type: Number, default: 2024 },
    engineCC: { type: Number, default: 1500 },
    fuelType: { type: String, default: 'petrol' },
    transmission: { type: String, default: 'automatic' },
    bodyType: { type: String, default: 'sedan' }
  },
  // Reference to Vehicle (optional - can use vehicleDetails instead)
  vehicle: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Vehicle'
  },
  month: {
    type: String,
    required: true,
    match: /^\d{4}-\d{2}$/ // YYYY-MM
  },
  retailPrice: {
    type: Number,
    required: true,
    min: 0
  },
  wholesalePrice: {
    type: Number,
    min: 0
  },
  customsValue: {
    type: Number,
    required: true,
    min: 0
  },
  depreciation: {
    year1: { type: Number, default: 10 },
    year2_3: { type: Number, default: 30 },
    year4_6: { type: Number, default: 50 },
    year7_8: { type: Number, default: 65 }
  },
  taxRates: {
    importDuty: { type: Number, default: 35 },
    exciseDuty: { type: Number, default: 20 },
    vat: { type: Number, default: 16 },
    idf: { type: Number, default: 2.5 },
    rdl: { type: Number, default: 2 }
  },
  notes: String,
  source: {
    type: String,
    enum: ['kra', 'user', 'admin'],
    default: 'kra'
  },
  confidenceScore: {
    type: Number,
    min: 0,
    max: 100,
    default: 90
  },
  uploadedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  // New field: owner – the user who owns this CRSP entry
  owner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: function() {
      return this.source === 'user';
    }
  },
  verification: {
    verified: { type: Boolean, default: false },
    verifiedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    verifiedAt: Date,
    verificationNotes: String
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

CRSPSchema.index({ vehicle: 1, month: -1 });
CRSPSchema.index({ source: 1, owner: 1 });
CRSPSchema.index({ 'vehicleDetails.make': 1, 'vehicleDetails.model': 1, 'vehicleDetails.year': 1 });

module.exports = mongoose.model('CRSP', CRSPSchema);
