const Expenditure = require('../models/Expenditure');
const Budget = require('../models/Budget');
const { runAnomalyDetection } = require('../utils/anomalyDetection');

const getExpenditures = async (req, res) => {
  try {
    const filter = {};
    if (req.query.departmentId) filter.departmentId = req.query.departmentId;
    if (req.query.budgetId) filter.budgetId = req.query.budgetId;
    if (req.query.status) filter.status = req.query.status;
    if (req.query.expenseCategory) filter.expenseCategory = req.query.expenseCategory;
    if (req.query.startDate || req.query.endDate) {
      filter.date = {};
      if (req.query.startDate) filter.date.$gte = new Date(req.query.startDate);
      if (req.query.endDate) filter.date.$lte = new Date(req.query.endDate);
    }
    if (req.user.role === 'department_head') filter.departmentId = req.user.departmentId;

    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;
    const total = await Expenditure.countDocuments(filter);
    const expenditures = await Expenditure.find(filter)
      .populate('budgetId', 'budgetCode financialYear allocatedAmount')
      .populate('departmentId', 'name code')
      .populate('createdBy', 'name')
      .populate('approvedBy', 'name')
      .sort({ date: -1 })
      .skip(skip)
      .limit(limit);

    res.json({ success: true, data: expenditures, pagination: { total, page, pages: Math.ceil(total / limit) } });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const getExpenditure = async (req, res) => {
  try {
    const exp = await Expenditure.findById(req.params.id)
      .populate('budgetId', 'budgetCode financialYear allocatedAmount spentAmount')
      .populate('departmentId', 'name code')
      .populate('createdBy', 'name')
      .populate('approvedBy', 'name');
    if (!exp) return res.status(404).json({ success: false, message: 'Expenditure not found' });
    res.json({ success: true, data: exp });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const createExpenditure = async (req, res) => {
  try {
    const { budgetId, departmentId, amount, expenseCategory, description, date } = req.body;
    const budget = await Budget.findById(budgetId);
    if (!budget) return res.status(404).json({ success: false, message: 'Budget not found' });
    if (budget.status !== 'active') return res.status(400).json({ success: false, message: 'Budget is not active' });
    if (budget.spentAmount + parseFloat(amount) > budget.allocatedAmount) {
      return res.status(400).json({ success: false, message: `Insufficient budget. Available: ₹${(budget.allocatedAmount - budget.spentAmount).toLocaleString('en-IN')}` });
    }

    const supportingDocument = req.file ? req.file.filename : null;
    const expenditure = await Expenditure.create({
      budgetId, departmentId: departmentId || budget.departmentId,
      amount, expenseCategory, description, date, supportingDocument,
      createdBy: req.user._id,
      status: req.user.role === 'admin' ? 'approved' : 'pending'
    });

    // Update budget spent amount
    await Budget.findByIdAndUpdate(budgetId, { $inc: { spentAmount: parseFloat(amount) } });

    // Run anomaly detection asynchronously
    setTimeout(() => runAnomalyDetection(budgetId), 1000);

    const populated = await Expenditure.findById(expenditure._id)
      .populate('budgetId', 'budgetCode financialYear')
      .populate('departmentId', 'name code');

    res.status(201).json({ success: true, message: 'Expenditure recorded', data: populated });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const updateExpenditure = async (req, res) => {
  try {
    const exp = await Expenditure.findById(req.params.id);
    if (!exp) return res.status(404).json({ success: false, message: 'Expenditure not found' });
    if (exp.status === 'approved') return res.status(400).json({ success: false, message: 'Cannot edit approved expenditure' });

    const oldAmount = exp.amount;
    const newAmount = req.body.amount || oldAmount;
    const diff = newAmount - oldAmount;

    const budget = await Budget.findById(exp.budgetId);
    if (diff > 0 && budget.spentAmount + diff > budget.allocatedAmount) {
      return res.status(400).json({ success: false, message: 'Insufficient budget for this update' });
    }

    const updated = await Expenditure.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true })
      .populate('departmentId', 'name code').populate('budgetId', 'budgetCode');
    if (diff !== 0) await Budget.findByIdAndUpdate(exp.budgetId, { $inc: { spentAmount: diff } });

    res.json({ success: true, message: 'Expenditure updated', data: updated });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const deleteExpenditure = async (req, res) => {
  try {
    const exp = await Expenditure.findById(req.params.id);
    if (!exp) return res.status(404).json({ success: false, message: 'Expenditure not found' });
    if (exp.status === 'approved') return res.status(400).json({ success: false, message: 'Cannot delete approved expenditure' });
    await Budget.findByIdAndUpdate(exp.budgetId, { $inc: { spentAmount: -exp.amount } });
    await Expenditure.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: 'Expenditure deleted' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const approveExpenditure = async (req, res) => {
  try {
    const exp = await Expenditure.findByIdAndUpdate(
      req.params.id,
      { status: 'approved', approvedBy: req.user._id, approvedAt: new Date() },
      { new: true }
    ).populate('departmentId', 'name').populate('budgetId', 'budgetCode');
    if (!exp) return res.status(404).json({ success: false, message: 'Expenditure not found' });
    res.json({ success: true, message: 'Expenditure approved', data: exp });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const rejectExpenditure = async (req, res) => {
  try {
    const { reason } = req.body;
    const exp = await Expenditure.findById(req.params.id);
    if (!exp) return res.status(404).json({ success: false, message: 'Expenditure not found' });
    // Reverse the spent amount
    await Budget.findByIdAndUpdate(exp.budgetId, { $inc: { spentAmount: -exp.amount } });
    const updated = await Expenditure.findByIdAndUpdate(
      req.params.id,
      { status: 'rejected', rejectionReason: reason, approvedBy: req.user._id, approvedAt: new Date() },
      { new: true }
    );
    res.json({ success: true, message: 'Expenditure rejected', data: updated });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const getCategoryStats = async (req, res) => {
  try {
    const filter = { status: 'approved' };
    if (req.user.role === 'department_head') filter.departmentId = req.user.departmentId;
    if (req.query.departmentId) filter.departmentId = req.query.departmentId;
    const stats = await Expenditure.aggregate([
      { $match: filter },
      { $group: { _id: '$expenseCategory', total: { $sum: '$amount' }, count: { $sum: 1 } } },
      { $sort: { total: -1 } }
    ]);
    res.json({ success: true, data: stats });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = { getExpenditures, getExpenditure, createExpenditure, updateExpenditure, deleteExpenditure, approveExpenditure, rejectExpenditure, getCategoryStats };
