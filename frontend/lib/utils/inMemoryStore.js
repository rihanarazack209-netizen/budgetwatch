const jwt = require('jsonwebtoken');

// Initial seed data in-memory
const departments = [
  { _id: 'dept_001', name: 'Ministry of Education', code: 'MOE', description: 'Responsible for education policy and school infrastructure nationwide', isActive: true },
  { _id: 'dept_002', name: 'Ministry of Health & Family Welfare', code: 'MOHFW', description: 'National health programs, hospitals, and medical infrastructure', isActive: true },
  { _id: 'dept_003', name: 'Ministry of Road Transport & Highways', code: 'MRTH', description: 'National highways, Bharatmala expressway development', isActive: true },
  { _id: 'dept_004', name: 'Ministry of Rural Development', code: 'MRD', description: 'Rural infrastructure, MGNREGA wages, PMGSY road connectivity', isActive: true },
  { _id: 'dept_005', name: 'Ministry of Defence', code: 'MOD', description: 'Defence capital procurement and border infrastructure', isActive: true }
];

const users = [
  { id: 'usr_001', name: 'Rajesh Kumar (Admin)', email: 'admin@budgetwatch.gov.in', password: 'Admin@123', role: 'admin', isActive: true, departmentId: null },
  { id: 'usr_002', name: 'Priya Sharma', email: 'priya.sharma@budgetwatch.gov.in', password: 'User@123', role: 'finance_officer', departmentId: departments[0], isActive: true },
  { id: 'usr_003', name: 'Arjun Mehta', email: 'arjun.mehta@budgetwatch.gov.in', password: 'User@123', role: 'finance_officer', departmentId: departments[1], isActive: true },
  { id: 'usr_004', name: 'Sunita Patel', email: 'sunita.patel@budgetwatch.gov.in', password: 'User@123', role: 'department_head', departmentId: departments[0], isActive: true },
  { id: 'usr_005', name: 'Dr. Vikram Singh', email: 'vikram.singh@budgetwatch.gov.in', password: 'User@123', role: 'department_head', departmentId: departments[1], isActive: true },
  { id: 'usr_006', name: 'Meena Gupta', email: 'meena.gupta@budgetwatch.gov.in', password: 'User@123', role: 'department_head', departmentId: departments[2], isActive: true }
];

const budgets = [
  { _id: 'bdg_001', budgetCode: 'BDG-2024-MOE-01', financialYear: '2024-25', departmentId: departments[0], allocatedAmount: 120000000000, spentAmount: 38400000000, startDate: '2024-04-01', endDate: '2025-03-31', status: 'active', notes: 'Samagra Shiksha Abhiyan + Mid-Day Meal' },
  { _id: 'bdg_002', budgetCode: 'BDG-2024-HLT-02', financialYear: '2024-25', departmentId: departments[1], allocatedAmount: 89000000000, spentAmount: 71200000000, startDate: '2024-04-01', endDate: '2025-03-31', status: 'active', notes: 'Ayushman Bharat & AIIMS Expansion' },
  { _id: 'bdg_003', budgetCode: 'BDG-2024-RTH-03', financialYear: '2024-25', departmentId: departments[2], allocatedAmount: 278000000000, spentAmount: 235300000000, startDate: '2024-04-01', endDate: '2025-03-31', status: 'active', notes: 'Bharatmala Phase II & NH Widening' },
  { _id: 'bdg_004', budgetCode: 'BDG-2024-MRD-04', financialYear: '2024-25', departmentId: departments[3], allocatedAmount: 175000000000, spentAmount: 52500000000, startDate: '2024-04-01', endDate: '2025-03-31', status: 'active', notes: 'MGNREGA, PMAY Gramin & PMGSY' },
  { _id: 'bdg_005', budgetCode: 'BDG-2024-DEF-05', financialYear: '2024-25', departmentId: departments[4], allocatedAmount: 621000000000, spentAmount: 527850000000, startDate: '2024-04-01', endDate: '2025-03-31', status: 'active', notes: 'Defence Capital Outlay & Border Roads' }
];

const expenditures = [
  { _id: 'exp_001', transactionId: 'TXN-EDU-001', budgetId: budgets[0], departmentId: departments[0], amount: 12000000000, expenseCategory: 'salaries', description: 'Govt school teachers salary Q1 FY2024-25', date: '2024-04-30', status: 'approved' },
  { _id: 'exp_002', transactionId: 'TXN-EDU-002', budgetId: budgets[0], departmentId: departments[0], amount: 8500000000, expenseCategory: 'infrastructure', description: 'PM SHRI school upgrade - 14,500 schools', date: '2024-05-15', status: 'approved' },
  { _id: 'exp_003', transactionId: 'TXN-EDU-003', budgetId: budgets[0], departmentId: departments[0], amount: 6200000000, expenseCategory: 'operations', description: 'Mid-Day Meal Scheme distribution Q1', date: '2024-06-30', status: 'approved' },
  { _id: 'exp_004', transactionId: 'TXN-EDU-004', budgetId: budgets[0], departmentId: departments[0], amount: 4800000000, expenseCategory: 'training', description: 'NISHTHA teacher training modules', date: '2024-07-20', status: 'approved' },
  { _id: 'exp_005', transactionId: 'TXN-EDU-005', budgetId: budgets[0], departmentId: departments[0], amount: 4900000000, expenseCategory: 'procurement', description: 'Digital tablets & smart boards for rural schools', date: '2024-08-10', status: 'approved' },
  { _id: 'exp_006', transactionId: 'TXN-EDU-006', budgetId: budgets[0], departmentId: departments[0], amount: 2000000000, expenseCategory: 'IT', description: 'DIKSHA national portal platform maintenance', date: '2024-09-05', status: 'pending' },

  { _id: 'exp_007', transactionId: 'TXN-HLT-001', budgetId: budgets[1], departmentId: departments[1], amount: 25000000000, expenseCategory: 'salaries', description: 'AIIMS & NHM medical staff remuneration', date: '2024-04-30', status: 'approved' },
  { _id: 'exp_008', transactionId: 'TXN-HLT-002', budgetId: budgets[1], departmentId: departments[1], amount: 18000000000, expenseCategory: 'procurement', description: 'Advanced diagnostic equipment & ICU ventilators', date: '2024-05-20', status: 'approved' },
  { _id: 'exp_009', transactionId: 'TXN-HLT-003', budgetId: budgets[1], departmentId: departments[1], amount: 12500000000, expenseCategory: 'operations', description: 'Ayushman Bharat PMJAY claim settlements', date: '2024-06-15', status: 'approved' },
  { _id: 'exp_010', transactionId: 'TXN-HLT-004', budgetId: budgets[1], departmentId: departments[1], amount: 9800000000, expenseCategory: 'infrastructure', description: 'New AIIMS campuses construction progress', date: '2024-07-30', status: 'approved' },

  { _id: 'exp_011', transactionId: 'TXN-RTH-001', budgetId: budgets[2], departmentId: departments[2], amount: 85000000000, expenseCategory: 'infrastructure', description: 'Bharatmala Phase II - NH-44 four-laning stretch', date: '2024-04-15', status: 'approved' },
  { _id: 'exp_012', transactionId: 'TXN-RTH-002', budgetId: budgets[2], departmentId: departments[2], amount: 62000000000, expenseCategory: 'procurement', description: 'Steel & structural concrete for expressways', date: '2024-05-10', status: 'approved' },
  { _id: 'exp_013', transactionId: 'TXN-RTH-003', budgetId: budgets[2], departmentId: departments[2], amount: 45300000000, expenseCategory: 'operations', description: 'Land compensation disbursements for highway corridors', date: '2024-06-20', status: 'approved' },

  { _id: 'exp_014', transactionId: 'TXN-MRD-001', budgetId: budgets[3], departmentId: departments[3], amount: 18500000000, expenseCategory: 'salaries', description: 'MGNREGA direct wage credits - Q1 FY2024-25', date: '2024-05-05', status: 'approved' },
  { _id: 'exp_015', transactionId: 'TXN-MRD-002', budgetId: budgets[3], departmentId: departments[3], amount: 22000000000, expenseCategory: 'infrastructure', description: 'PMAY-Gramin housing subsidy disbursements', date: '2024-06-10', status: 'approved' },
  { _id: 'exp_016', transactionId: 'TXN-MRD-003', budgetId: budgets[3], departmentId: departments[3], amount: 12000000000, expenseCategory: 'operations', description: 'PMGSY rural road connectivity works in tribal districts', date: '2024-07-15', status: 'pending' },

  { _id: 'exp_017', transactionId: 'TXN-DEF-001', budgetId: budgets[4], departmentId: departments[4], amount: 180000000000, expenseCategory: 'procurement', description: 'Capital defence modernization - Tejas Mk1A & P-8I fleet', date: '2024-04-20', status: 'approved' },
  { _id: 'exp_018', transactionId: 'TXN-DEF-002', budgetId: budgets[4], departmentId: departments[4], amount: 215000000000, expenseCategory: 'salaries', description: 'Armed forces military payroll & pensions', date: '2024-05-31', status: 'approved' },
  { _id: 'exp_019', transactionId: 'TXN-DEF-003', budgetId: budgets[4], departmentId: departments[4], amount: 95000000000, expenseCategory: 'infrastructure', description: 'Strategic border roads & mountain tunnel projects', date: '2024-07-12', status: 'approved' }
];

const alerts = [
  {
    _id: 'alt_001',
    alertCode: 'ALT-EDU-01',
    departmentId: departments[0],
    budgetId: budgets[0],
    alertType: 'under_utilization',
    severity: 'high',
    message: 'Ministry of Education has utilized only 32% of annual budget while 58% of the financial year has elapsed. Immediate acceleration required on approved school schemes.',
    details: { utilization: 32, timeElapsed: 58 },
    isRead: false,
    isResolved: false,
    createdAt: new Date('2024-08-15').toISOString()
  },
  {
    _id: 'alt_002',
    alertCode: 'ALT-MRD-02',
    departmentId: departments[3],
    budgetId: budgets[3],
    alertType: 'under_utilization',
    severity: 'critical',
    message: 'Ministry of Rural Development is at only 30% utilization. MGNREGA disbursements are lagging behind Q2 disbursement targets.',
    details: { utilization: 30, timeElapsed: 58 },
    isRead: false,
    isResolved: false,
    createdAt: new Date('2024-08-20').toISOString()
  },
  {
    _id: 'alt_003',
    alertCode: 'ALT-RTH-03',
    departmentId: departments[2],
    budgetId: budgets[2],
    alertType: 'spending_spike',
    severity: 'medium',
    message: 'Unusual spending spike detected in Ministry of Road Transport. Single voucher of ₹85,000 Cr represents 30.6% of annual budget allocation.',
    details: { transactionId: 'TXN-RTH-001', amount: 85000000000, budgetPct: 30.6 },
    isRead: true,
    isResolved: false,
    createdAt: new Date('2024-05-01').toISOString()
  },
  {
    _id: 'alt_004',
    alertCode: 'ALT-HLT-04',
    departmentId: departments[1],
    budgetId: budgets[1],
    alertType: 'threshold_breach',
    severity: 'low',
    message: 'Ministry of Health utilization is at 80% - approaching 100% capacity. Review supplemental Q3-Q4 allocations.',
    details: { utilization: 80 },
    isRead: true,
    isResolved: true,
    resolvedBy: { name: 'Rajesh Kumar (Admin)' },
    createdAt: new Date('2024-08-01').toISOString()
  }
];

const thresholds = [
  { key: 'under_utilization_threshold', value: 40, description: 'Alert when utilization % is below this value' },
  { key: 'time_elapsed_threshold', value: 70, description: 'Time elapsed % of financial year to evaluate under-utilization' },
  { key: 'spending_spike_threshold', value: 30, description: 'Alert when a single transaction is this % of total budget' },
  { key: 'inactivity_days', value: 30, description: 'Alert when no transactions for this many consecutive days' }
];

const auditLogs = [
  { _id: 'aud_001', userName: 'Rajesh Kumar (Admin)', action: 'SEED_DATABASE', entity: 'System', ipAddress: '127.0.0.1', createdAt: new Date().toISOString() },
  { _id: 'aud_002', userName: 'Priya Sharma', action: 'RECORD_EXPENDITURE', entity: 'Expenditure', ipAddress: '127.0.0.1', createdAt: new Date('2024-09-05').toISOString() }
];

module.exports = {
  departments,
  users,
  budgets,
  expenditures,
  alerts,
  thresholds,
  auditLogs
};
