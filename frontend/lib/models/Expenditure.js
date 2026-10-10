const mongoose = require('mongoose');

const ExpenditureSchema = new mongoose.Schema({
  transactionId: { type: String, unique: true },
  budgetId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Budget',
    required: [true, 'Budget ID is required']
  },
  departmentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Department',
    required: [true, 'Department is required']
  },
  amount: {
    type: Number,
    required: [true, 'Amount is required'],
    min: [1, 'Amount must be greater than 0']
  },
  expenseCategory: {
    type: String,
    enum: ['salaries', 'infrastructure', 'operations', 'training', 'procurement', 'maintenance', 'IT', 'other'],
    required: [true, 'Expense category is required']
  },
  description: {
    type: String,
    required: [true, 'Description is required'],
    trim: true
  },
  date: { type: Date, required: true, default: Date.now },
  supportingDocument: { type: String, default: null },
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected'],
    default: 'pending'
  },
  approvedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  approvedAt: { type: Date, default: null },
  rejectionReason: { type: String, default: null },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
}, { timestamps: true });

ExpenditureSchema.pre('save', function (next) {
  if (!this.transactionId) {
    this.transactionId = `TXN-${Date.now()}-${Math.floor(Math.random() * 9999)}`;
  }
  next();
});

module.exports = mongoose.model('Expenditure', ExpenditureSchema);
