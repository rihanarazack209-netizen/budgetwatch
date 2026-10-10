const Alert = require('../models/Alert');

const getAlerts = async (req, res) => {
  try {
    const filter = {};
    if (req.query.alertType) filter.alertType = req.query.alertType;
    if (req.query.severity) filter.severity = req.query.severity;
    if (req.query.isRead !== undefined) filter.isRead = req.query.isRead === 'true';
    if (req.query.isResolved !== undefined) filter.isResolved = req.query.isResolved === 'true';
    if (req.query.departmentId) filter.departmentId = req.query.departmentId;
    if (req.user.role === 'department_head') filter.departmentId = req.user.departmentId;

    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const total = await Alert.countDocuments(filter);
    const alerts = await Alert.find(filter)
      .populate('departmentId', 'name code')
      .populate('budgetId', 'budgetCode financialYear allocatedAmount spentAmount')
      .populate('resolvedBy', 'name')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit);

    res.json({ success: true, data: alerts, pagination: { total, page, pages: Math.ceil(total / limit) } });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const getAlertStats = async (req, res) => {
  try {
    const filter = {};
    if (req.user.role === 'department_head') filter.departmentId = req.user.departmentId;
    const stats = await Alert.aggregate([
      { $match: filter },
      {
        $group: {
          _id: null,
          total: { $sum: 1 },
          unread: { $sum: { $cond: [{ $eq: ['$isRead', false] }, 1, 0] } },
          unresolved: { $sum: { $cond: [{ $eq: ['$isResolved', false] }, 1, 0] } },
          critical: { $sum: { $cond: [{ $eq: ['$severity', 'critical'] }, 1, 0] } },
          high: { $sum: { $cond: [{ $eq: ['$severity', 'high'] }, 1, 0] } }
        }
      }
    ]);
    const byType = await Alert.aggregate([
      { $match: { ...filter, isResolved: false } },
      { $group: { _id: '$alertType', count: { $sum: 1 } } }
    ]);
    res.json({ success: true, data: { summary: stats[0] || { total: 0, unread: 0, unresolved: 0, critical: 0, high: 0 }, byType } });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const markAsRead = async (req, res) => {
  try {
    const alert = await Alert.findByIdAndUpdate(req.params.id, { isRead: true }, { new: true });
    if (!alert) return res.status(404).json({ success: false, message: 'Alert not found' });
    res.json({ success: true, message: 'Alert marked as read', data: alert });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const markAllRead = async (req, res) => {
  try {
    const filter = { isRead: false };
    if (req.user.role === 'department_head') filter.departmentId = req.user.departmentId;
    await Alert.updateMany(filter, { isRead: true });
    res.json({ success: true, message: 'All alerts marked as read' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const resolveAlert = async (req, res) => {
  try {
    const alert = await Alert.findByIdAndUpdate(
      req.params.id,
      { isResolved: true, isRead: true, resolvedBy: req.user._id, resolvedAt: new Date() },
      { new: true }
    ).populate('departmentId', 'name').populate('resolvedBy', 'name');
    if (!alert) return res.status(404).json({ success: false, message: 'Alert not found' });
    res.json({ success: true, message: 'Alert resolved', data: alert });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const deleteAlert = async (req, res) => {
  try {
    const alert = await Alert.findByIdAndDelete(req.params.id);
    if (!alert) return res.status(404).json({ success: false, message: 'Alert not found' });
    res.json({ success: true, message: 'Alert deleted' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = { getAlerts, getAlertStats, markAsRead, markAllRead, resolveAlert, deleteAlert };
