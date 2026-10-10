const User = require('../models/User');
const AuditLog = require('../models/AuditLog');
const Settings = require('../models/Settings');
const Budget = require('../models/Budget');
const Department = require('../models/Department');
const Alert = require('../models/Alert');

const getUsers = async (req, res) => {
  try {
    const filter = {};
    if (req.query.role) filter.role = req.query.role;
    if (req.query.departmentId) filter.departmentId = req.query.departmentId;
    const users = await User.find(filter).populate('departmentId', 'name code').sort({ createdAt: -1 });
    res.json({ success: true, data: users });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const createUser = async (req, res) => {
  try {
    const existing = await User.findOne({ email: req.body.email });
    if (existing) return res.status(400).json({ success: false, message: 'Email already registered' });
    const user = await User.create(req.body);
    res.status(201).json({ success: true, message: 'User created', data: { id: user._id, name: user.name, email: user.email, role: user.role } });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const updateUser = async (req, res) => {
  try {
    const { name, role, departmentId, isActive } = req.body;
    const user = await User.findByIdAndUpdate(
      req.params.id, { name, role, departmentId, isActive }, { new: true, runValidators: true }
    ).populate('departmentId', 'name code');
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });
    res.json({ success: true, message: 'User updated', data: user });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const deactivateUser = async (req, res) => {
  try {
    if (req.params.id === req.user._id.toString()) {
      return res.status(400).json({ success: false, message: 'Cannot deactivate your own account' });
    }
    const user = await User.findByIdAndUpdate(req.params.id, { isActive: false }, { new: true });
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });
    res.json({ success: true, message: 'User deactivated' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const getAuditLogs = async (req, res) => {
  try {
    const filter = {};
    if (req.query.userId) filter.userId = req.query.userId;
    if (req.query.entity) filter.entity = req.query.entity;
    if (req.query.action) filter.action = new RegExp(req.query.action, 'i');
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 30;
    const total = await AuditLog.countDocuments(filter);
    const logs = await AuditLog.find(filter)
      .populate('userId', 'name email role')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit);
    res.json({ success: true, data: logs, pagination: { total, page, pages: Math.ceil(total / limit) } });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const getThresholds = async (req, res) => {
  try {
    const defaults = [
      { key: 'under_utilization_threshold', value: 40, description: 'Alert when utilization % is below this value' },
      { key: 'time_elapsed_threshold', value: 70, description: 'Time elapsed % of financial year to check under-utilization' },
      { key: 'spending_spike_threshold', value: 30, description: 'Alert when single transaction is this % of total budget' },
      { key: 'inactivity_days', value: 30, description: 'Alert when no transactions for this many days' }
    ];
    const settings = await Settings.find({});
    const result = defaults.map(d => {
      const found = settings.find(s => s.key === d.key);
      return found ? { ...d, value: found.value, _id: found._id } : d;
    });
    res.json({ success: true, data: result });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const updateThresholds = async (req, res) => {
  try {
    const updates = req.body; // array of { key, value }
    const results = await Promise.all(updates.map(({ key, value }) =>
      Settings.findOneAndUpdate({ key }, { value, updatedBy: req.user._id }, { upsert: true, new: true })
    ));
    res.json({ success: true, message: 'Thresholds updated', data: results });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const getSystemStats = async (req, res) => {
  try {
    const [users, departments, budgets, alerts] = await Promise.all([
      User.countDocuments({ isActive: true }),
      Department.countDocuments({ isActive: true }),
      Budget.countDocuments({ status: 'active' }),
      Alert.countDocuments({ isResolved: false })
    ]);
    res.json({ success: true, data: { activeUsers: users, activeDepartments: departments, activeBudgets: budgets, unresolvedAlerts: alerts } });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = { getUsers, createUser, updateUser, deactivateUser, getAuditLogs, getThresholds, updateThresholds, getSystemStats };
