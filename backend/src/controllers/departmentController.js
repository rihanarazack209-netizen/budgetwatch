const Department = require('../models/Department');
const Budget = require('../models/Budget');
const User = require('../models/User');

const getDepartments = async (req, res) => {
  try {
    const departments = await Department.find({ isActive: true }).populate('headUserId', 'name email');
    const depts = await Promise.all(departments.map(async (dept) => {
      const budgets = await Budget.find({ departmentId: dept._id, status: 'active' });
      const totalAllocated = budgets.reduce((sum, b) => sum + b.allocatedAmount, 0);
      const totalSpent = budgets.reduce((sum, b) => sum + b.spentAmount, 0);
      return {
        ...dept.toObject(),
        totalAllocated,
        totalSpent,
        utilization: totalAllocated ? parseFloat(((totalSpent / totalAllocated) * 100).toFixed(2)) : 0,
        activeBudgets: budgets.length
      };
    }));
    res.json({ success: true, data: depts });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const getDepartment = async (req, res) => {
  try {
    const dept = await Department.findById(req.params.id).populate('headUserId', 'name email');
    if (!dept) return res.status(404).json({ success: false, message: 'Department not found' });
    res.json({ success: true, data: dept });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const createDepartment = async (req, res) => {
  try {
    const dept = await Department.create(req.body);
    res.status(201).json({ success: true, message: 'Department created', data: dept });
  } catch (error) {
    if (error.code === 11000) return res.status(400).json({ success: false, message: 'Department name or code already exists' });
    res.status(500).json({ success: false, message: error.message });
  }
};

const updateDepartment = async (req, res) => {
  try {
    const dept = await Department.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    if (!dept) return res.status(404).json({ success: false, message: 'Department not found' });
    res.json({ success: true, message: 'Department updated', data: dept });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const deleteDepartment = async (req, res) => {
  try {
    const dept = await Department.findByIdAndUpdate(req.params.id, { isActive: false }, { new: true });
    if (!dept) return res.status(404).json({ success: false, message: 'Department not found' });
    res.json({ success: true, message: 'Department deactivated' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = { getDepartments, getDepartment, createDepartment, updateDepartment, deleteDepartment };
