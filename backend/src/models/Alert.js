const mongoose = require('mongoose');

const AlertSchema = new mongoose.Schema({
  alertCode: { type: String, unique: true },
  departmentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Department', required: true },
  budgetId: { type: mongoose.Schema.Types.ObjectId, ref: 'Budget', required: true },
  alertType: {
    type: String,
    enum: ['under_utilization', 'overspending', 'spending_spike', 'threshold_breach', 'inactivity'],
    required: true
  },
  severity: {
    type: String,
    enum: ['low', 'medium', 'high', 'critical'],
    required: true
  },
  message: { type: String, required: true },
  details: { type: mongoose.Schema.Types.Mixed, default: {} },
  isRead: { type: Boolean, default: false },
  isResolved: { type: Boolean, default: false },
  resolvedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  resolvedAt: { type: Date, default: null }
}, { timestamps: true });

AlertSchema.pre('save', function (next) {
  if (!this.alertCode) {
    this.alertCode = `ALT-${Date.now()}-${Math.floor(Math.random() * 999)}`;
  }
  next();
});

module.exports = mongoose.model('Alert', AlertSchema);
