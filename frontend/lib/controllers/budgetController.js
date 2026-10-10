const Budget = require('../models/Budget');
const Department = require('../models/Department');

const buildFilter = (query, user) => {
  const filter = {};
  if (query.financialYear) filter.financialYear = query.financialYear;
  if (query.status) filter.status = query.status;
  if (query.departmentId) filter.departmentId = query.departmentId;
  if (user.role === 'department_head') filter.departmentId = user.departmentId;
  return filter;
};

const getBudgets = async (req, res) => {
  try {
    const filter = buildFilter(req.query, req.user);
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;
    const total = await Budget.countDocuments(filter);
    const budgets = await Budget.find(filter)
      .populate('departmentId', 'name code')
      .populate('createdBy', 'name')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);
    res.json({ success: true, data: budgets, pagination: { total, page, pages: Math.ceil(total / limit) } });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const getBudget = async (req, res) => {
  try {
    const budget = await Budget.findById(req.params.id)
      .populate('departmentId', 'name code')
      .populate('createdBy', 'name')
      .populate('updatedBy', 'name');
    if (!budget) return res.status(404).json({ success: false, message: 'Budget not found' });
    if (req.user.role === 'department_head' && budget.departmentId._id.toString() !== req.user.departmentId?.toString()) {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }
    res.json({ success: true, data: budget });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const createBudget = async (req, res) => {
  try {
    const { financialYear, departmentId, allocatedAmount, startDate, endDate, notes } = req.body;
    if (new Date(startDate) >= new Date(endDate)) {
      return res.status(400).json({ success: false, message: 'Start date must be before end date' });
    }
    const existing = await Budget.findOne({ financialYear, departmentId, status: 'active' });
    if (existing) {
      return res.status(400).json({ success: false, message: 'Active budget already exists for this department and financial year' });
    }
    const budget = await Budget.create({ financialYear, departmentId, allocatedAmount, startDate, endDate, notes, createdBy: req.user._id });
    const populated = await Budget.findById(budget._id).populate('departmentId', 'name code');
    res.status(201).json({ success: true, message: 'Budget created', data: populated });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const updateBudget = async (req, res) => {
  try {
    const { allocatedAmount, status, notes, endDate } = req.body;
    const budget = await Budget.findById(req.params.id);
    if (!budget) return res.status(404).json({ success: false, message: 'Budget not found' });
    if (allocatedAmount && allocatedAmount < budget.spentAmount) {
      return res.status(400).json({ success: false, message: 'Allocated amount cannot be less than already spent amount' });
    }
    const updated = await Budget.findByIdAndUpdate(
      req.params.id,
      { allocatedAmount, status, notes, endDate, updatedBy: req.user._id },
      { new: true, runValidators: true }
    ).populate('departmentId', 'name code');
    res.json({ success: true, message: 'Budget updated', data: updated });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const deleteBudget = async (req, res) => {
  try {
    const budget = await Budget.findById(req.params.id);
    if (!budget) return res.status(404).json({ success: false, message: 'Budget not found' });
    if (budget.spentAmount > 0) {
      return res.status(400).json({ success: false, message: 'Cannot delete budget with existing expenditures' });
    }
    await Budget.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: 'Budget deleted' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const getBudgetSummary = async (req, res) => {
  try {
    const filter = buildFilter(req.query, req.user);
    const summary = await Budget.aggregate([
      { $match: filter },
      {
        $group: {
          _id: null,
          totalAllocated: { $sum: '$allocatedAmount' },
          totalSpent: { $sum: '$spentAmount' },
          totalBudgets: { $sum: 1 },
          avgUtilization: { $avg: { $multiply: [{ $divide: ['$spentAmount', '$allocatedAmount'] }, 100] } }
        }
      }
    ]);
    const byDept = await Budget.aggregate([
      { $match: { ...filter, status: 'active' } },
      {
        $group: {
          _id: '$departmentId',
          allocated: { $sum: '$allocatedAmount' },
          spent: { $sum: '$spentAmount' }
        }
      },
      { $lookup: { from: 'departments', localField: '_id', foreignField: '_id', as: 'department' } },
      { $unwind: '$department' },
      { $project: { name: '$department.name', code: '$department.code', allocated: 1, spent: 1, utilization: { $multiply: [{ $divide: ['$spent', '$allocated'] }, 100] } } }
    ]);
    res.json({ success: true, data: { summary: summary[0] || {}, byDepartment: byDept } });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = { getBudgets, getBudget, createBudget, updateBudget, deleteBudget, getBudgetSummary };
