const mongoose = require('mongoose');

const auditLogSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  action: {
    type: String,
    required: true,
    enum: [
      'login',
      'logout',
      'tax_calculation',
      'crsp_update',
      'document_upload',
      'report_generation',
      'user_management',
      'system_backup',
      'settings_update',
      'failed_login'
    ]
  },
  entity: {
    type: String,
    required: true
  },
  entityId: {
    type: String
  },
  description: {
    type: String,
    required: true
  },
  ipAddress: {
    type: String
  },
  userAgent: {
    type: String
  },
  location: {
    city: String,
    country: String,
    region: String
  },
  status: {
    type: String,
    enum: ['success', 'failed', 'warning'],
    default: 'success'
  },
  metadata: {
    type: mongoose.Schema.Types.Mixed
  }
}, {
  timestamps: true
});

// Indexes for efficient querying
auditLogSchema.index({ user: 1, createdAt: -1 });
auditLogSchema.index({ action: 1 });
auditLogSchema.index({ status: 1 });
auditLogSchema.index({ createdAt: -1 });

module.exports = mongoose.model('AuditLog', auditLogSchema);