const Budget = require('../models/Budget');
const Expenditure = require('../models/Expenditure');
const Alert = require('../models/Alert');
const Department = require('../models/Department');
const { runFullCheck } = require('../utils/anomalyDetection');

const getDashboardStats = async (req, res) => {
  try {
    const deptFilter = req.user.role === 'department_head' ? { departmentId: req.user.departmentId } : {};
    const currentYear = '2024-25';

    // Budget totals
    const budgetAgg = await Budget.aggregate([
      { $match: { financialYear: currentYear, status: 'active', ...deptFilter } },
      { $group: { _id: null, totalAllocated: { $sum: '$allocatedAmount' }, totalSpent: { $sum: '$spentAmount' }, count: { $sum: 1 } } }
    ]);
    const budgetStats = budgetAgg[0] || { totalAllocated: 0, totalSpent: 0, count: 0 };
    const utilization = budgetStats.totalAllocated ? ((budgetStats.totalSpent / budgetStats.totalAllocated) * 100).toFixed(2) : 0;

    // Department count
    const activeDepts = await Department.countDocuments({ isActive: true });

    // Alert stats
    const alertFilter = { isResolved: false, ...(req.user.role === 'department_head' ? { departmentId: req.user.departmentId } : {}) };
    const alertCount = await Alert.countDocuments(alertFilter);
    const criticalAlerts = await Alert.countDocuments({ ...alertFilter, severity: 'critical' });

    // Recent transactions
    const recentTransactions = await Expenditure.find(deptFilter)
      .populate('departmentId', 'name')
      .populate('budgetId', 'budgetCode')
      .sort({ createdAt: -1 })
      .limit(5);

    // Recent alerts
    const recentAlerts = await Alert.find(alertFilter)
      .populate('departmentId', 'name')
      .sort({ createdAt: -1 })
      .limit(5);

    // Monthly spending trend (last 6 months)
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
    const monthlyTrend = await Expenditure.aggregate([
      { $match: { date: { $gte: sixMonthsAgo }, status: 'approved', ...deptFilter } },
      { $group: { _id: { year: { $year: '$date' }, month: { $month: '$date' } }, total: { $sum: '$amount' }, count: { $sum: 1 } } },
      { $sort: { '_id.year': 1, '_id.month': 1 } }
    ]);

    // Pending expenditures
    const pendingExp = await Expenditure.countDocuments({ status: 'pending', ...deptFilter });

    res.json({
      success: true,
      data: {
        totalAllocated: budgetStats.totalAllocated,
        totalSpent: budgetStats.totalSpent,
        totalRemaining: budgetStats.totalAllocated - budgetStats.totalSpent,
        utilizationPercentage: parseFloat(utilization),
        activeBudgets: budgetStats.count,
        activeDepartments: activeDepts,
        totalAlerts: alertCount,
        criticalAlerts,
        pendingExpenditures: pendingExp,
        recentTransactions,
        recentAlerts,
        monthlyTrend
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const getDepartmentUtilization = async (req, res) => {
  try {
    const currentYear = req.query.financialYear || '2024-25';
    const result = await Budget.aggregate([
      { $match: { financialYear: currentYear, status: 'active' } },
      {
        $group: {
          _id: '$departmentId',
          totalAllocated: { $sum: '$allocatedAmount' },
          totalSpent: { $sum: '$spentAmount' },
          budgetCount: { $sum: 1 }
        }
      },
      { $lookup: { from: 'departments', localField: '_id', foreignField: '_id', as: 'department' } },
      { $unwind: '$department' },
      {
        $project: {
          departmentName: '$department.name',
          departmentCode: '$department.code',
          totalAllocated: 1,
          totalSpent: 1,
          totalRemaining: { $subtract: ['$totalAllocated', '$totalSpent'] },
          utilizationPercentage: {
            $round: [{ $multiply: [{ $divide: ['$totalSpent', '$totalAllocated'] }, 100] }, 2]
          },
          budgetCount: 1
        }
      },
      { $sort: { utilizationPercentage: -1 } }
    ]);
    res.json({ success: true, data: result });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const getSpendingTrends = async (req, res) => {
  try {
    const months = parseInt(req.query.months) || 12;
    const startDate = new Date();
    startDate.setMonth(startDate.getMonth() - months);
    const filter = { date: { $gte: startDate }, status: 'approved' };
    if (req.user.role === 'department_head') filter.departmentId = req.user.departmentId;

    const trend = await Expenditure.aggregate([
      { $match: filter },
      {
        $group: {
          _id: { year: { $year: '$date' }, month: { $month: '$date' } },
          totalSpent: { $sum: '$amount' },
          transactionCount: { $sum: 1 }
        }
      },
      { $sort: { '_id.year': 1, '_id.month': 1 } },
      {
        $project: {
          year: '$_id.year',
          month: '$_id.month',
          totalSpent: 1,
          transactionCount: 1,
          label: { $concat: [{ $toString: '$_id.year' }, '-', { $toString: '$_id.month' }] }
        }
      }
    ]);
    res.json({ success: true, data: trend });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const runAnomalyDetectionRoute = async (req, res) => {
  try {
    const results = await runFullCheck();
    res.json({ success: true, message: 'Anomaly detection completed', data: results });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = { getDashboardStats, getDepartmentUtilization, getSpendingTrends, runAnomalyDetectionRoute };
