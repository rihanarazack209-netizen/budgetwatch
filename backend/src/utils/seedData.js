require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const User = require('../models/User');
const Department = require('../models/Department');
const Budget = require('../models/Budget');
const Expenditure = require('../models/Expenditure');
const Alert = require('../models/Alert');

const connectDB = async () => {
  await mongoose.connect(process.env.MONGO_URI);
  console.log('✅ Connected to MongoDB for seeding');
};

const seed = async () => {
  await connectDB();

  // Clear existing data
  await Promise.all([User.deleteMany(), Department.deleteMany(), Budget.deleteMany(), Expenditure.deleteMany(), Alert.deleteMany()]);
  console.log('🗑️  Cleared existing data');

  // --- Departments ---
  const departments = await Department.insertMany([
    { name: 'Ministry of Education', code: 'MOE', description: 'Responsible for education policy and implementation across India' },
    { name: 'Ministry of Health & Family Welfare', code: 'MOHFW', description: 'National health programs, hospitals, and public health initiatives' },
    { name: 'Ministry of Road Transport & Highways', code: 'MRTH', description: 'National highways, road infrastructure development' },
    { name: 'Ministry of Rural Development', code: 'MRD', description: 'Rural infrastructure, MGNREGA, PMGSY programs' },
    { name: 'Ministry of Defence', code: 'MOD', description: 'Defence services, border security infrastructure' }
  ]);
  console.log(`✅ Created ${departments.length} departments`);

  // --- Users ---
  const salt = await bcrypt.genSalt(10);
  const adminPass = await bcrypt.hash('Admin@123', salt);
  const userPass = await bcrypt.hash('User@123', salt);

  const users = await User.insertMany([
    { name: 'Rajesh Kumar (Admin)', email: 'admin@budgetwatch.gov.in', password: adminPass, role: 'admin', isActive: true },
    { name: 'Priya Sharma', email: 'priya.sharma@budgetwatch.gov.in', password: userPass, role: 'finance_officer', departmentId: departments[0]._id, isActive: true },
    { name: 'Arjun Mehta', email: 'arjun.mehta@budgetwatch.gov.in', password: userPass, role: 'finance_officer', departmentId: departments[1]._id, isActive: true },
    { name: 'Sunita Patel', email: 'sunita.patel@budgetwatch.gov.in', password: userPass, role: 'department_head', departmentId: departments[0]._id, isActive: true },
    { name: 'Dr. Vikram Singh', email: 'vikram.singh@budgetwatch.gov.in', password: userPass, role: 'department_head', departmentId: departments[1]._id, isActive: true },
    { name: 'Meena Gupta', email: 'meena.gupta@budgetwatch.gov.in', password: userPass, role: 'department_head', departmentId: departments[2]._id, isActive: true }
  ]);
  console.log(`✅ Created ${users.length} users`);

  // Update department heads
  await Department.findByIdAndUpdate(departments[0]._id, { headUserId: users[3]._id });
  await Department.findByIdAndUpdate(departments[1]._id, { headUserId: users[4]._id });
  await Department.findByIdAndUpdate(departments[2]._id, { headUserId: users[5]._id });

  const adminId = users[0]._id;

  // --- Budgets (FY 2024-25, amounts in INR) ---
  const budgets = await Budget.insertMany([
    { financialYear: '2024-25', departmentId: departments[0]._id, allocatedAmount: 120000000000, spentAmount: 38400000000, startDate: new Date('2024-04-01'), endDate: new Date('2025-03-31'), status: 'active', notes: 'Samagra Shiksha Abhiyan + Mid-Day Meal Scheme', createdBy: adminId },
    { financialYear: '2024-25', departmentId: departments[1]._id, allocatedAmount: 89000000000, spentAmount: 71200000000, startDate: new Date('2024-04-01'), endDate: new Date('2025-03-31'), status: 'active', notes: 'Ayushman Bharat, NHM, AIIMS expansion', createdBy: adminId },
    { financialYear: '2024-25', departmentId: departments[2]._id, allocatedAmount: 278000000000, spentAmount: 235300000000, startDate: new Date('2024-04-01'), endDate: new Date('2025-03-31'), status: 'active', notes: 'Bharatmala Project Phase II, NH widening', createdBy: adminId },
    { financialYear: '2024-25', departmentId: departments[3]._id, allocatedAmount: 175000000000, spentAmount: 52500000000, startDate: new Date('2024-04-01'), endDate: new Date('2025-03-31'), status: 'active', notes: 'MGNREGA, PMAY Gramin, PMGSY', createdBy: adminId },
    { financialYear: '2024-25', departmentId: departments[4]._id, allocatedAmount: 621000000000, spentAmount: 527850000000, startDate: new Date('2024-04-01'), endDate: new Date('2025-03-31'), status: 'active', notes: 'Capital defence expenditure, border infrastructure', createdBy: adminId }
  ]);
  console.log(`✅ Created ${budgets.length} budgets`);

  // --- Expenditures ---
  const expenditures = [
    { budgetId: budgets[0]._id, departmentId: departments[0]._id, amount: 12000000000, expenseCategory: 'salaries', description: 'Teacher salaries Q1 FY 2024-25 - 8.5 lakh govt school teachers', date: new Date('2024-04-30'), status: 'approved', createdBy: users[1]._id, approvedBy: adminId },
    { budgetId: budgets[0]._id, departmentId: departments[0]._id, amount: 8500000000, expenseCategory: 'infrastructure', description: 'PM SHRI school infrastructure upgrade - 14,500 schools nationwide', date: new Date('2024-05-15'), status: 'approved', createdBy: users[1]._id, approvedBy: adminId },
    { budgetId: budgets[0]._id, departmentId: departments[0]._id, amount: 6200000000, expenseCategory: 'operations', description: 'Mid-Day Meal Scheme - Q1 distribution, 11.8 crore beneficiaries', date: new Date('2024-06-30'), status: 'approved', createdBy: users[1]._id, approvedBy: adminId },
    { budgetId: budgets[0]._id, departmentId: departments[0]._id, amount: 4800000000, expenseCategory: 'training', description: 'NISHTHA teacher training program - 25 lakh teachers', date: new Date('2024-07-20'), status: 'approved', createdBy: users[1]._id, approvedBy: adminId },
    { budgetId: budgets[0]._id, departmentId: departments[0]._id, amount: 4900000000, expenseCategory: 'procurement', description: 'Digital education equipment - tablets, smart boards for rural schools', date: new Date('2024-08-10'), status: 'approved', createdBy: users[1]._id, approvedBy: adminId },
    { budgetId: budgets[0]._id, departmentId: departments[0]._id, amount: 2000000000, expenseCategory: 'IT', description: 'DIKSHA platform upgrade and content digitization', date: new Date('2024-09-05'), status: 'pending', createdBy: users[1]._id },

    { budgetId: budgets[1]._id, departmentId: departments[1]._id, amount: 25000000000, expenseCategory: 'salaries', description: 'AIIMS & Central Hospital staff salaries + NHM workers', date: new Date('2024-04-30'), status: 'approved', createdBy: users[2]._id, approvedBy: adminId },
    { budgetId: budgets[1]._id, departmentId: departments[1]._id, amount: 18000000000, expenseCategory: 'procurement', description: 'Medical equipment procurement - ventilators, ICU beds, MRI machines', date: new Date('2024-05-20'), status: 'approved', createdBy: users[2]._id, approvedBy: adminId },
    { budgetId: budgets[1]._id, departmentId: departments[1]._id, amount: 12500000000, expenseCategory: 'operations', description: 'Ayushman Bharat PMJAY claim reimbursements Q1', date: new Date('2024-06-15'), status: 'approved', createdBy: users[2]._id, approvedBy: adminId },
    { budgetId: budgets[1]._id, departmentId: departments[1]._id, amount: 9800000000, expenseCategory: 'infrastructure', description: 'New AIIMS construction - 22 new campuses under development', date: new Date('2024-07-30'), status: 'approved', createdBy: users[2]._id, approvedBy: adminId },
    { budgetId: budgets[1]._id, departmentId: departments[1]._id, amount: 5900000000, expenseCategory: 'procurement', description: 'COVID-19 emergency vaccine procurement Q2', date: new Date('2024-08-25'), status: 'approved', createdBy: users[2]._id, approvedBy: adminId },

    { budgetId: budgets[2]._id, departmentId: departments[2]._id, amount: 85000000000, expenseCategory: 'infrastructure', description: 'Bharatmala Phase II - NH-44 four laning, 850 km stretch', date: new Date('2024-04-15'), status: 'approved', createdBy: adminId, approvedBy: adminId },
    { budgetId: budgets[2]._id, departmentId: departments[2]._id, amount: 62000000000, expenseCategory: 'procurement', description: 'Construction materials - steel, cement for 12 expressway projects', date: new Date('2024-05-10'), status: 'approved', createdBy: adminId, approvedBy: adminId },
    { budgetId: budgets[2]._id, departmentId: departments[2]._id, amount: 45300000000, expenseCategory: 'operations', description: 'Land acquisition compensation - UP, Bihar, MP highway corridors', date: new Date('2024-06-20'), status: 'approved', createdBy: adminId, approvedBy: adminId },
    { budgetId: budgets[2]._id, departmentId: departments[2]._id, amount: 43000000000, expenseCategory: 'maintenance', description: 'National highway toll operations and maintenance FY 2024-25', date: new Date('2024-07-05'), status: 'approved', createdBy: adminId, approvedBy: adminId },

    { budgetId: budgets[3]._id, departmentId: departments[3]._id, amount: 18500000000, expenseCategory: 'salaries', description: 'MGNREGA wages - 5.2 crore active job cards, Q1 payment', date: new Date('2024-05-05'), status: 'approved', createdBy: adminId, approvedBy: adminId },
    { budgetId: budgets[3]._id, departmentId: departments[3]._id, amount: 22000000000, expenseCategory: 'infrastructure', description: 'PMAY-G - 12 lakh housing units construction subsidy', date: new Date('2024-06-10'), status: 'approved', createdBy: adminId, approvedBy: adminId },
    { budgetId: budgets[3]._id, departmentId: departments[3]._id, amount: 12000000000, expenseCategory: 'operations', description: 'PMGSY rural road connectivity - 8,000 km new roads in Jharkhand, Odisha', date: new Date('2024-07-15'), status: 'pending', createdBy: adminId },

    { budgetId: budgets[4]._id, departmentId: departments[4]._id, amount: 180000000000, expenseCategory: 'procurement', description: 'Defence capital procurement - Tejas MK-1A, Arjun MBT, P-8I aircraft', date: new Date('2024-04-20'), status: 'approved', createdBy: adminId, approvedBy: adminId },
    { budgetId: budgets[4]._id, departmentId: departments[4]._id, amount: 215000000000, expenseCategory: 'salaries', description: 'Armed forces salaries, MSP, pensions - 14 lakh active + 32 lakh veteran', date: new Date('2024-05-31'), status: 'approved', createdBy: adminId, approvedBy: adminId },
    { budgetId: budgets[4]._id, departmentId: departments[4]._id, amount: 95000000000, expenseCategory: 'infrastructure', description: 'Border infrastructure - LAC roads, forward bases, Arunachal tunnels', date: new Date('2024-07-12'), status: 'approved', createdBy: adminId, approvedBy: adminId },
    { budgetId: budgets[4]._id, departmentId: departments[4]._id, amount: 37850000000, expenseCategory: 'maintenance', description: 'Defence equipment maintenance, ordnance factory operations', date: new Date('2024-09-01'), status: 'approved', createdBy: adminId, approvedBy: adminId }
  ];

  await Expenditure.insertMany(expenditures);
  console.log(`✅ Created ${expenditures.length} expenditure transactions`);

  // --- Alerts ---
  const alerts = [
    { departmentId: departments[0]._id, budgetId: budgets[0]._id, alertType: 'under_utilization', severity: 'high', message: 'Ministry of Education has utilized only 32% of annual budget while 55% of the financial year has elapsed. Immediate action required to accelerate spending on approved schemes.', details: { utilization: 32, timeElapsed: 55 } },
    { departmentId: departments[3]._id, budgetId: budgets[3]._id, alertType: 'under_utilization', severity: 'critical', message: 'Ministry of Rural Development at only 30% utilization with 55% year elapsed. MGNREGA disbursements lagging behind targets.', details: { utilization: 30, timeElapsed: 55 } },
    { departmentId: departments[2]._id, budgetId: budgets[2]._id, alertType: 'spending_spike', severity: 'medium', message: 'Unusual spending spike detected in Ministry of Road Transport. Single procurement of ₹85,000 Cr represents 30.6% of annual budget allocation.', details: { transactionId: 'TXN-INFRA-001', amount: 85000000000, budgetPct: 30.6 } },
    { departmentId: departments[1]._id, budgetId: budgets[1]._id, alertType: 'threshold_breach', severity: 'low', message: 'Ministry of Health utilization at 80% - approaching full budget consumption. Review remaining Q3-Q4 requirements.', details: { utilization: 80 } }
  ];

  await Alert.insertMany(alerts);
  console.log(`✅ Created ${alerts.length} alerts`);

  console.log('\n🎉 Seed data loaded successfully!\n');
  console.log('📋 Login credentials:');
  console.log('  Admin:          admin@budgetwatch.gov.in     | Admin@123');
  console.log('  Finance Officer: priya.sharma@budgetwatch.gov.in | User@123');
  console.log('  Dept Head:      sunita.patel@budgetwatch.gov.in | User@123');

  mongoose.disconnect();
};

seed().catch(err => { console.error('Seed error:', err); mongoose.disconnect(); });
