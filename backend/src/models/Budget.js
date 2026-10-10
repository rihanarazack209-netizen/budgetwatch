const mongoose = require('mongoose');

const BudgetSchema = new mongoose.Schema({
  budgetCode: { type: String, unique: true },
  financialYear: {
    type: String,
    required: [true, 'Financial year is required'],
    match: [/^\d{4}-\d{2}$/, 'Financial year format must be YYYY-YY (e.g. 2024-25)']
  },
  departmentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Department',
    required: [true, 'Department is required']
  },
  allocatedAmount: {
    type: Number,
    required: [true, 'Allocated amount is required'],
    min: [1, 'Allocated amount must be greater than 0']
  },
  spentAmount: { type: Number, default: 0, min: 0 },
  startDate: { type: Date, required: true },
  endDate: { type: Date, required: true },
  status: {
    type: String,
    enum: ['active', 'closed', 'suspended'],
    default: 'active'
  },
  notes: { type: String, trim: true },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
}, { timestamps: true, toJSON: { virtuals: true }, toObject: { virtuals: true } });

BudgetSchema.virtual('remainingAmount').get(function () {
  return this.allocatedAmount - this.spentAmount;
});

BudgetSchema.virtual('utilizationPercentage').get(function () {
  if (!this.allocatedAmount) return 0;
  return parseFloat(((this.spentAmount / this.allocatedAmount) * 100).toFixed(2));
});

BudgetSchema.pre('save', function (next) {
  if (!this.budgetCode) {
    this.budgetCode = `BDG-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
  }
  next();
});

module.exports = mongoose.model('Budget', BudgetSchema);
