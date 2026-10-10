const express = require('express');
const jwt = require('jsonwebtoken');
const store = require('../utils/inMemoryStore');
const XLSX = require('xlsx');
const PDFDocument = require('pdfkit');

const router = express.Router();

// Helper JWT
const makeToken = (user) => {
  return jwt.sign(
    { id: user.id || user._id, role: user.role, departmentId: user.departmentId?._id || user.departmentId },
    process.env.JWT_SECRET || 'secret',
    { expiresIn: '7d' }
  );
};

// --- AUTH ---
router.post('/auth/login', (req, res) => {
  const { email, password } = req.body;
  const user = store.users.find(u => u.email.toLowerCase() === email?.toLowerCase() && u.password === password);
  if (!user) {
    return res.status(401).json({ success: false, message: 'Invalid email or password' });
  }
  const token = makeToken(user);
  res.json({
    success: true,
    message: 'Login successful',
    data: {
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        department: user.departmentId,
        isActive: user.isActive
      }
    }
  });
});

router.get('/auth/me', (req, res) => {
  res.json({ success: true, data: store.users[0] });
});

// --- DEPARTMENTS ---
router.get('/departments', (req, res) => {
  const data = store.departments.map(d => {
    const bList = store.budgets.filter(b => (b.departmentId?._id || b.departmentId) === d._id);
    const totalAllocated = bList.reduce((s, b) => s + b.allocatedAmount, 0);
    const totalSpent = bList.reduce((s, b) => s + b.spentAmount, 0);
    return {
      ...d,
      totalAllocated,
      totalSpent,
      utilization: totalAllocated ? parseFloat(((totalSpent / totalAllocated) * 100).toFixed(2)) : 0,
      activeBudgets: bList.length
    };
  });
  res.json({ success: true, data });
});

router.post('/departments', (req, res) => {
  const newDept = { _id: `dept_${Date.now()}`, ...req.body, isActive: true };
  store.departments.push(newDept);
  res.status(201).json({ success: true, data: newDept });
});

// --- BUDGETS ---
router.get('/budgets', (req, res) => {
  let list = [...store.budgets];
  if (req.query.financialYear) list = list.filter(b => b.financialYear === req.query.financialYear);
  if (req.query.status) list = list.filter(b => b.status === req.query.status);
  if (req.query.departmentId) list = list.filter(b => (b.departmentId?._id || b.departmentId) === req.query.departmentId);

  const enriched = list.map(b => ({
    ...b,
    remainingAmount: b.allocatedAmount - b.spentAmount,
    utilizationPercentage: parseFloat(((b.spentAmount / b.allocatedAmount) * 100).toFixed(2))
  }));
  res.json({ success: true, data: enriched, pagination: { total: enriched.length, page: 1, pages: 1 } });
});

router.post('/budgets', (req, res) => {
  const dept = store.departments.find(d => d._id === req.body.departmentId) || store.departments[0];
  const newB = {
    _id: `bdg_${Date.now()}`,
    budgetCode: `BDG-${Date.now()}`,
    spentAmount: 0,
    ...req.body,
    departmentId: dept,
    allocatedAmount: Number(req.body.allocatedAmount)
  };
  store.budgets.push(newB);
  res.status(201).json({ success: true, data: newB });
});

router.put('/budgets/:id', (req, res) => {
  const idx = store.budgets.findIndex(b => b._id === req.params.id);
  if (idx !== -1) {
    store.budgets[idx] = { ...store.budgets[idx], ...req.body };
    return res.json({ success: true, data: store.budgets[idx] });
  }
  res.status(404).json({ success: false, message: 'Budget not found' });
});

router.delete('/budgets/:id', (req, res) => {
  const idx = store.budgets.findIndex(b => b._id === req.params.id);
  if (idx !== -1) {
    store.budgets.splice(idx, 1);
    return res.json({ success: true, message: 'Budget deleted' });
  }
  res.status(404).json({ success: false, message: 'Budget not found' });
});

// --- EXPENDITURES ---
router.get('/expenditures', (req, res) => {
  let list = [...store.expenditures];
  if (req.query.expenseCategory) list = list.filter(e => e.expenseCategory === req.query.expenseCategory);
  if (req.query.status) list = list.filter(e => e.status === req.query.status);
  if (req.query.departmentId) list = list.filter(e => (e.departmentId?._id || e.departmentId) === req.query.departmentId);

  res.json({ success: true, data: list, pagination: { total: list.length, page: 1, pages: 1 } });
});

router.post('/expenditures', (req, res) => {
  const b = store.budgets.find(bg => bg._id === req.body.budgetId) || store.budgets[0];
  const amt = Number(req.body.amount);
  const newExp = {
    _id: `exp_${Date.now()}`,
    transactionId: `TXN-${Date.now()}`,
    status: 'approved',
    ...req.body,
    amount: amt,
    budgetId: b,
    departmentId: b.departmentId
  };
  store.expenditures.unshift(newExp);
  b.spentAmount += amt;
  res.status(201).json({ success: true, data: newExp });
});

router.put('/expenditures/:id/approve', (req, res) => {
  const exp = store.expenditures.find(e => e._id === req.params.id);
  if (exp) {
    exp.status = 'approved';
    return res.json({ success: true, data: exp });
  }
  res.status(404).json({ success: false, message: 'Expenditure not found' });
});

router.put('/expenditures/:id/reject', (req, res) => {
  const exp = store.expenditures.find(e => e._id === req.params.id);
  if (exp) {
    exp.status = 'rejected';
    const b = store.budgets.find(bg => bg._id === (exp.budgetId?._id || exp.budgetId));
    if (b) b.spentAmount = Math.max(0, b.spentAmount - exp.amount);
    return res.json({ success: true, data: exp });
  }
  res.status(404).json({ success: false, message: 'Expenditure not found' });
});

router.get('/expenditures/categories/stats', (req, res) => {
  const map = {};
  store.expenditures.forEach(e => {
    if (!map[e.expenseCategory]) map[e.expenseCategory] = { total: 0, count: 0 };
    map[e.expenseCategory].total += e.amount;
    map[e.expenseCategory].count += 1;
  });
  const data = Object.keys(map).map(k => ({ _id: k, total: map[k].total, count: map[k].count }));
  res.json({ success: true, data });
});

// --- MONITORING ---
router.get('/monitoring/dashboard', (req, res) => {
  const totalAllocated = store.budgets.reduce((s, b) => s + b.allocatedAmount, 0);
  const totalSpent = store.budgets.reduce((s, b) => s + b.spentAmount, 0);
  const utilizationPercentage = totalAllocated ? parseFloat(((totalSpent / totalAllocated) * 100).toFixed(2)) : 0;
  const criticalAlerts = store.alerts.filter(a => a.severity === 'critical' && !a.isResolved).length;
  const pendingExpenditures = store.expenditures.filter(e => e.status === 'pending').length;

  const monthlyTrend = [
    { _id: { year: 2024, month: 4 }, total: 295000000000, count: 4 },
    { _id: { year: 2024, month: 5 }, total: 310000000000, count: 5 },
    { _id: { year: 2024, month: 6 }, total: 120000000000, count: 3 },
    { _id: { year: 2024, month: 7 }, total: 110000000000, count: 3 },
    { _id: { year: 2024, month: 8 }, total: 40000000000, count: 2 },
    { _id: { year: 2024, month: 9 }, total: 50000000000, count: 2 }
  ];

  res.json({
    success: true,
    data: {
      totalAllocated,
      totalSpent,
      totalRemaining: totalAllocated - totalSpent,
      utilizationPercentage,
      activeBudgets: store.budgets.length,
      activeDepartments: store.departments.length,
      totalAlerts: store.alerts.filter(a => !a.isResolved).length,
      criticalAlerts,
      pendingExpenditures,
      recentTransactions: store.expenditures.slice(0, 5),
      recentAlerts: store.alerts.slice(0, 5),
      monthlyTrend
    }
  });
});

router.get('/monitoring/department-utilization', (req, res) => {
  const data = store.departments.map(d => {
    const bList = store.budgets.filter(b => (b.departmentId?._id || b.departmentId) === d._id);
    const totalAllocated = bList.reduce((s, b) => s + b.allocatedAmount, 0);
    const totalSpent = bList.reduce((s, b) => s + b.spentAmount, 0);
    return {
      _id: d._id,
      departmentName: d.name,
      departmentCode: d.code,
      totalAllocated,
      totalSpent,
      totalRemaining: totalAllocated - totalSpent,
      utilizationPercentage: totalAllocated ? parseFloat(((totalSpent / totalAllocated) * 100).toFixed(2)) : 0,
      budgetCount: bList.length
    };
  });
  res.json({ success: true, data });
});

router.post('/monitoring/run-detection', (req, res) => {
  res.json({ success: true, message: 'Detection finished', data: { budgetsChecked: store.budgets.length, newAlerts: 1 } });
});

// --- ALERTS ---
router.get('/alerts', (req, res) => {
  let list = [...store.alerts];
  if (req.query.severity) list = list.filter(a => a.severity === req.query.severity);
  if (req.query.alertType) list = list.filter(a => a.alertType === req.query.alertType);
  if (req.query.isResolved !== undefined) list = list.filter(a => String(a.isResolved) === req.query.isResolved);
  res.json({ success: true, data: list, pagination: { total: list.length, page: 1, pages: 1 } });
});

router.get('/alerts/stats', (req, res) => {
  const total = store.alerts.length;
  const unread = store.alerts.filter(a => !a.isRead).length;
  const unresolved = store.alerts.filter(a => !a.isResolved).length;
  const critical = store.alerts.filter(a => a.severity === 'critical').length;
  const high = store.alerts.filter(a => a.severity === 'high').length;
  res.json({
    success: true,
    data: {
      summary: { total, unread, unresolved, critical, high },
      byType: [{ _id: 'under_utilization', count: 2 }, { _id: 'spending_spike', count: 1 }]
    }
  });
});

router.put('/alerts/mark-all-read', (req, res) => {
  store.alerts.forEach(a => a.isRead = true);
  res.json({ success: true, message: 'All read' });
});

router.put('/alerts/:id/read', (req, res) => {
  const a = store.alerts.find(alt => alt._id === req.params.id);
  if (a) a.isRead = true;
  res.json({ success: true, data: a });
});

router.put('/alerts/:id/resolve', (req, res) => {
  const a = store.alerts.find(alt => alt._id === req.params.id);
  if (a) {
    a.isResolved = true;
    a.isRead = true;
    a.resolvedBy = { name: 'Rajesh Kumar (Admin)' };
  }
  res.json({ success: true, data: a });
});

// --- REPORTS ---
router.get('/reports/financial-summary', (req, res) => {
  const data = store.departments.map(d => {
    const bList = store.budgets.filter(b => (b.departmentId?._id || b.departmentId) === d._id);
    const totalAllocated = bList.reduce((s, b) => s + b.allocatedAmount, 0);
    const totalSpent = bList.reduce((s, b) => s + b.spentAmount, 0);
    return {
      department: d.name,
      code: d.code,
      totalAllocated,
      totalSpent,
      remaining: totalAllocated - totalSpent,
      utilization: totalAllocated ? parseFloat(((totalSpent / totalAllocated) * 100).toFixed(2)) : 0,
      budgetCount: bList.length
    };
  });
  res.json({ success: true, data });
});

router.get('/reports/export/csv', (req, res) => {
  const rows = store.budgets.map(b => ({
    'Budget Code': b.budgetCode,
    'Financial Year': b.financialYear,
    'Department': b.departmentId?.name,
    'Allocated (INR)': b.allocatedAmount,
    'Spent (INR)': b.spentAmount,
    'Remaining (INR)': b.allocatedAmount - b.spentAmount,
    'Utilization %': ((b.spentAmount / b.allocatedAmount) * 100).toFixed(2)
  }));
  const ws = XLSX.utils.json_to_sheet(rows);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Budget Report');
  const buf = XLSX.write(wb, { type: 'buffer', bookType: 'csv' });
  res.setHeader('Content-Type', 'text/csv');
  res.setHeader('Content-Disposition', 'attachment; filename=budget-report.csv');
  res.send(buf);
});

router.get('/reports/export/pdf', (req, res) => {
  const doc = new PDFDocument({ margin: 50 });
  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', 'attachment; filename=budget-report.pdf');
  doc.pipe(res);
  doc.fontSize(20).fillColor('#1a237e').text('BudgetWatch - Statutory Audit Report', { align: 'center' });
  doc.fontSize(12).fillColor('#555').text(`FY 2024-25 | Generated: ${new Date().toLocaleDateString('en-IN')}`, { align: 'center' });
  doc.moveDown(2);
  doc.fontSize(14).fillColor('#1a237e').text('Departmental Summary');
  doc.moveTo(50, doc.y).lineTo(560, doc.y).stroke('#1a237e');
  doc.moveDown(1);
  store.budgets.forEach(b => {
    doc.fontSize(10).fillColor('#333').text(`${b.departmentId?.name}: Allocated ₹${(b.allocatedAmount/10000000).toFixed(0)}Cr, Spent ₹${(b.spentAmount/10000000).toFixed(0)}Cr (${((b.spentAmount/b.allocatedAmount)*100).toFixed(1)}%)`);
    doc.moveDown(0.5);
  });
  doc.end();
});

// --- ADMIN ---
router.get('/admin/stats', (req, res) => {
  res.json({
    success: true,
    data: {
      activeUsers: store.users.length,
      activeDepartments: store.departments.length,
      activeBudgets: store.budgets.length,
      unresolvedAlerts: store.alerts.filter(a => !a.isResolved).length
    }
  });
});

router.get('/admin/users', (req, res) => {
  res.json({ success: true, data: store.users });
});

router.post('/admin/users', (req, res) => {
  const newUser = { id: `usr_${Date.now()}`, isActive: true, ...req.body };
  store.users.push(newUser);
  res.status(201).json({ success: true, data: newUser });
});

router.delete('/admin/users/:id', (req, res) => {
  const u = store.users.find(usr => usr.id === req.params.id);
  if (u) u.isActive = false;
  res.json({ success: true, message: 'User deactivated' });
});

router.get('/admin/thresholds', (req, res) => {
  res.json({ success: true, data: store.thresholds });
});

router.put('/admin/thresholds', (req, res) => {
  res.json({ success: true, message: 'Thresholds updated', data: store.thresholds });
});

router.get('/admin/audit-logs', (req, res) => {
  res.json({ success: true, data: store.auditLogs, pagination: { total: store.auditLogs.length, page: 1, pages: 1 } });
});

module.exports = router;
