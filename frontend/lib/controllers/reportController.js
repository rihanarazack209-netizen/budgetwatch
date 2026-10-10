const Budget = require('../models/Budget');
const Expenditure = require('../models/Expenditure');
const Department = require('../models/Department');
const XLSX = require('xlsx');
const PDFDocument = require('pdfkit');

const formatINR = (amount) => {
  if (amount >= 10000000) return `₹${(amount / 10000000).toFixed(2)} Cr`;
  if (amount >= 100000) return `₹${(amount / 100000).toFixed(2)} L`;
  return `₹${amount.toLocaleString('en-IN')}`;
};

const getFinancialSummary = async (req, res) => {
  try {
    const { financialYear = '2024-25', departmentId } = req.query;
    const budgetFilter = { financialYear };
    if (departmentId) budgetFilter.departmentId = departmentId;
    if (req.user.role === 'department_head') budgetFilter.departmentId = req.user.departmentId;

    const summary = await Budget.aggregate([
      { $match: budgetFilter },
      {
        $group: {
          _id: '$departmentId',
          totalAllocated: { $sum: '$allocatedAmount' },
          totalSpent: { $sum: '$spentAmount' },
          budgetCount: { $sum: 1 }
        }
      },
      { $lookup: { from: 'departments', localField: '_id', foreignField: '_id', as: 'dept' } },
      { $unwind: '$dept' },
      {
        $project: {
          department: '$dept.name',
          code: '$dept.code',
          totalAllocated: 1, totalSpent: 1,
          remaining: { $subtract: ['$totalAllocated', '$totalSpent'] },
          utilization: { $round: [{ $multiply: [{ $divide: ['$totalSpent', '$totalAllocated'] }, 100] }, 2] },
          budgetCount: 1
        }
      },
      { $sort: { utilization: -1 } }
    ]);
    res.json({ success: true, data: summary });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const generateCSV = async (req, res) => {
  try {
    const { financialYear = '2024-25', departmentId } = req.query;
    const filter = { financialYear };
    if (departmentId) filter.departmentId = departmentId;
    if (req.user.role === 'department_head') filter.departmentId = req.user.departmentId;

    const budgets = await Budget.find(filter).populate('departmentId', 'name code');
    const rows = budgets.map(b => ({
      'Budget Code': b.budgetCode,
      'Financial Year': b.financialYear,
      'Department': b.departmentId?.name || 'N/A',
      'Dept Code': b.departmentId?.code || 'N/A',
      'Allocated (INR)': b.allocatedAmount,
      'Spent (INR)': b.spentAmount,
      'Remaining (INR)': b.allocatedAmount - b.spentAmount,
      'Utilization %': b.utilizationPercentage,
      'Status': b.status,
      'Start Date': b.startDate?.toISOString().split('T')[0],
      'End Date': b.endDate?.toISOString().split('T')[0]
    }));

    const ws = XLSX.utils.json_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Budget Report');
    const buf = XLSX.write(wb, { type: 'buffer', bookType: 'csv' });

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename=budget-report-${financialYear}.csv`);
    res.send(buf);
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const generatePDF = async (req, res) => {
  try {
    const { financialYear = '2024-25' } = req.query;
    const filter = { financialYear };
    if (req.user.role === 'department_head') filter.departmentId = req.user.departmentId;

    const budgets = await Budget.find(filter).populate('departmentId', 'name code');
    const totalAllocated = budgets.reduce((s, b) => s + b.allocatedAmount, 0);
    const totalSpent = budgets.reduce((s, b) => s + b.spentAmount, 0);

    const doc = new PDFDocument({ margin: 50 });
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=budget-report-${financialYear}.pdf`);
    doc.pipe(res);

    // Header
    doc.fontSize(20).fillColor('#1a237e').text('BudgetWatch - Financial Report', { align: 'center' });
    doc.fontSize(12).fillColor('#555').text(`Financial Year: ${financialYear}`, { align: 'center' });
    doc.text(`Generated: ${new Date().toLocaleDateString('en-IN')}`, { align: 'center' });
    doc.moveDown(2);

    // Summary
    doc.fontSize(14).fillColor('#1a237e').text('Summary');
    doc.moveTo(50, doc.y).lineTo(560, doc.y).stroke('#1a237e');
    doc.moveDown(0.5);
    doc.fontSize(11).fillColor('#333');
    doc.text(`Total Allocated: ${formatINR(totalAllocated)}`);
    doc.text(`Total Spent: ${formatINR(totalSpent)}`);
    doc.text(`Total Remaining: ${formatINR(totalAllocated - totalSpent)}`);
    doc.text(`Overall Utilization: ${totalAllocated ? ((totalSpent / totalAllocated) * 100).toFixed(2) : 0}%`);
    doc.moveDown(2);

    // Department table
    doc.fontSize(14).fillColor('#1a237e').text('Department-wise Breakdown');
    doc.moveTo(50, doc.y).lineTo(560, doc.y).stroke('#1a237e');
    doc.moveDown(0.5);

    const colWidths = [130, 100, 100, 100, 80];
    const headers = ['Department', 'Allocated', 'Spent', 'Remaining', 'Utilization%'];
    let x = 50, y = doc.y;

    // Table header
    doc.fontSize(10).fillColor('#ffffff');
    doc.rect(50, y, 510, 20).fill('#1a237e');
    headers.forEach((h, i) => {
      doc.fillColor('#ffffff').text(h, x + colWidths.slice(0, i).reduce((a, b) => a + b, 0), y + 5, { width: colWidths[i] });
    });
    y += 22;

    // Table rows
    budgets.forEach((b, idx) => {
      if (y > 700) { doc.addPage(); y = 50; }
      doc.rect(50, y, 510, 18).fill(idx % 2 === 0 ? '#f5f5f5' : '#ffffff');
      const util = b.utilizationPercentage;
      doc.fillColor(util < 40 ? '#c62828' : util < 70 ? '#e65100' : '#2e7d32');
      const vals = [b.departmentId?.name || 'N/A', formatINR(b.allocatedAmount), formatINR(b.spentAmount), formatINR(b.allocatedAmount - b.spentAmount), `${util}%`];
      let cx = 50;
      vals.forEach((v, i) => {
        doc.fontSize(9).text(v, cx, y + 4, { width: colWidths[i] });
        cx += colWidths[i];
      });
      y += 20;
    });

    doc.end();
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const getExpenditureReport = async (req, res) => {
  try {
    const filter = {};
    if (req.query.departmentId) filter.departmentId = req.query.departmentId;
    if (req.query.startDate) filter.date = { $gte: new Date(req.query.startDate) };
    if (req.query.endDate) filter.date = { ...filter.date, $lte: new Date(req.query.endDate) };
    if (req.query.status) filter.status = req.query.status;
    if (req.user.role === 'department_head') filter.departmentId = req.user.departmentId;

    const data = await Expenditure.find(filter)
      .populate('departmentId', 'name code')
      .populate('budgetId', 'budgetCode financialYear')
      .populate('createdBy', 'name')
      .sort({ date: -1 });

    res.json({ success: true, data });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = { getFinancialSummary, generateCSV, generatePDF, getExpenditureReport };
