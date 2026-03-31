const mongoose = require('mongoose');

const vehicleSchema = new mongoose.Schema({
  make: {
    type: String,
    required: [true, 'Make is required'],
    trim: true,
    index: true
  },
  model: {
    type: String,
    required: [true, 'Model is required'],
    trim: true,
    index: true
  },
  year: {
    type: Number,
    required: [true, 'Year is required'],
    min: 1990,
    max: new Date().getFullYear() + 1
  },
  trim: {
    type: String,
    trim: true
  },
  engineCC: {
    type: Number,
    required: [true, 'Engine CC is required'],
    min: 0
  },
  fuelType: {
    type: String,
    required: [true, 'Fuel type is required'],
    enum: ['petrol', 'diesel', 'hybrid', 'electric', 'other']
  },
  transmission: {
    type: String,
    required: [true, 'Transmission is required'],
    enum: ['manual', 'automatic', 'CVT', 'semi-automatic']
  },
  bodyType: {
    type: String,
    enum: ['sedan', 'hatchback', 'SUV', 'truck', 'van', 'bus', 'other']
  },
  doors: {
    type: Number,
    min: 2,
    max: 6
  },
  seats: {
    type: Number,
    min: 1,
    max: 20
  },
  driveType: {
    type: String,
    enum: ['FWD', 'RWD', 'AWD', '4WD']
  },
  color: {
    type: String,
    trim: true
  },
  features: [{
    type: String,
    trim: true
  }],
  specifications: {
    length: Number,
    width: Number,
    height: Number,
    weight: Number,
    fuelTank: Number,
    fuelConsumption: Number,
    emissions: Number,
    power: Number,
    torque: Number
  },
  status: {
    type: String,
    enum: ['active', 'inactive', 'discontinued'],
    default: 'active'
  },
  sourceCountry: {
    type: String,
    trim: true
  },
  isPopular: {
    type: Boolean,
    default: false
  },
  searchCount: {
    type: Number,
    default: 0
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  lastUpdatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
}, {
  timestamps: true
});

// Indexes for efficient searching
vehicleSchema.index({ make: 1, model: 1, year: -1 });
vehicleSchema.index({ make: 1, model: 1 });
vehicleSchema.index({ year: -1 });
vehicleSchema.index({ isPopular: 1 });

module.exports = mongoose.model('Vehicle', vehicleSchema);