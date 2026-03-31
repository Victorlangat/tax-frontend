const mongoose = require('mongoose');

const documentSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  documentType: {
    type: String,
    required: true,
    enum: ['invoice', 'bill_of_lading', 'export_certificate', 'inspection_certificate', 'crsp_sheet', 'other']
  },
  filename: {
    type: String,
    required: true
  },
  originalName: {
    type: String,
    required: true
  },
  filePath: {
    type: String,
    required: true
  },
  mimeType: {
    type: String,
    required: true
  },
  size: {
    type: Number,
    required: true
  },
  vehicle: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Vehicle'
  },
  calculation: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Calculation'
  },
  description: {
    type: String,
    trim: true
  },
  status: {
    type: String,
    enum: ['uploaded', 'verified', 'rejected'],
    default: 'uploaded'
  },
  verification: {
    isVerified: Boolean,
    verifiedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    verifiedAt: Date,
    verificationNotes: String,
    discrepancies: [String]
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Document', documentSchema);