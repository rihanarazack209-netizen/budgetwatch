const Budget = require('../models/Budget');
const Expenditure = require('../models/Expenditure');
const Alert = require('../models/Alert');
const Settings = require('../models/Settings');

const getThresholdValue = async (key, defaultVal) => {
  const setting = await Settings.findOne({ key });
  return setting ? parseFloat(setting.value) : defaultVal;
};

const createAlertIfNotExists = async (alertData) => {
  try {
    // Check for recent unresolved alert of same type for same budget
    const existing = await Alert.findOne({
      budgetId: alertData.budgetId,
      alertType: alertData.alertType,
      isResolved: false,
      createdAt: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) } // within last 24h
    });
    if (!existing) {
      await Alert.create(alertData);
      console.log(`🚨 Alert created: ${alertData.alertType} for budget ${alertData.budgetId}`);
    }
  } catch (err) {
    console.error('Error creating alert:', err.message);
  }
};

const checkUnderUtilization = async (budget, thresholds) => {
  const { utilizationThreshold, timeElapsedThreshold } = thresholds;
  const now = new Date();
  const start = new Date(budget.startDate);
  const end = new Date(budget.endDate);
  const totalDays = (end - start) / (1000 * 60 * 60 * 24);
  const elapsedDays = (now - start) / (1000 * 60 * 60 * 24);
  const timeElapsedPct = Math.min((elapsedDays / totalDays) * 100, 100);
  const utilization = budget.allocatedAmount > 0 ? (budget.spentAmount / budget.allocatedAmount) * 100 : 0;

  if (timeElapsedPct >= timeElapsedThreshold && utilization < utilizationThreshold) {
    await createAlertIfNotExists({
      departmentId: budget.departmentId,
      budgetId: budget._id,
      alertType: 'under_utilization',
      severity: utilization < 20 ? 'critical' : utilization < 30 ? 'high' : 'medium',
      message: `Department has only utilized ${utilization.toFixed(1)}% of budget while ${timeElapsedPct.toFixed(1)}% of the financial year has elapsed. Budget: ${budget.budgetCode}`,
      details: { utilization: utilization.toFixed(2), timeElapsed: timeElapsedPct.toFixed(2), allocatedAmount: budget.allocatedAmount, spentAmount: budget.spentAmount }
    });
  }
};

const checkOverspending = async (budget) => {
  if (budget.spentAmount > budget.allocatedAmount) {
    await createAlertIfNotExists({
      departmentId: budget.departmentId,
      budgetId: budget._id,
      alertType: 'overspending',
      severity: 'critical',
      message: `Budget EXCEEDED! Spent ₹${budget.spentAmount.toLocaleString('en-IN')} against allocated ₹${budget.allocatedAmount.toLocaleString('en-IN')}. Overshoot: ₹${(budget.spentAmount - budget.allocatedAmount).toLocaleString('en-IN')}`,
      details: { allocatedAmount: budget.allocatedAmount, spentAmount: budget.spentAmount, excess: budget.spentAmount - budget.allocatedAmount }
    });
  }
};

const checkSpendingSpike = async (budget, spikeThreshold) => {
  const recent = await Expenditure.find({ budgetId: budget._id, status: { $ne: 'rejected' } }).sort({ date: -1 }).limit(20);
  if (recent.length < 2) return;
  const avgAmount = recent.slice(1).reduce((s, e) => s + e.amount, 0) / (recent.length - 1);
  const latest = recent[0];
  const budgetPct = (latest.amount / budget.allocatedAmount) * 100;
  const avgMultiple = avgAmount > 0 ? latest.amount / avgAmount : 0;

  if (budgetPct >= spikeThreshold || avgMultiple >= 3) {
    await createAlertIfNotExists({
      departmentId: budget.departmentId,
      budgetId: budget._id,
      alertType: 'spending_spike',
      severity: budgetPct >= 50 ? 'critical' : budgetPct >= 30 ? 'high' : 'medium',
      message: `Unusual spending spike detected! Transaction of ₹${latest.amount.toLocaleString('en-IN')} represents ${budgetPct.toFixed(1)}% of total budget (${avgMultiple.toFixed(1)}x the average transaction).`,
      details: { transactionId: latest.transactionId, amount: latest.amount, budgetPct: budgetPct.toFixed(2), avgMultiple: avgMultiple.toFixed(2) }
    });
  }
};

const checkInactivity = async (budget, inactivityDays) => {
  const utilization = budget.allocatedAmount > 0 ? (budget.spentAmount / budget.allocatedAmount) * 100 : 0;
  if (utilization >= 90) return; // Budget nearly complete, no inactivity concern

  const cutoff = new Date(Date.now() - inactivityDays * 24 * 60 * 60 * 1000);
  const lastTxn = await Expenditure.findOne({ budgetId: budget._id }).sort({ date: -1 });

  if (!lastTxn || new Date(lastTxn.date) < cutoff) {
    const daysSince = lastTxn ? Math.floor((Date.now() - new Date(lastTxn.date)) / (1000 * 60 * 60 * 24)) : null;
    await createAlertIfNotExists({
      departmentId: budget.departmentId,
      budgetId: budget._id,
      alertType: 'inactivity',
      severity: 'medium',
      message: `No expenditure activity for ${daysSince !== null ? daysSince + ' days' : 'an extended period'}. Budget utilization is at ${utilization.toFixed(1)}%.`,
      details: { lastTransaction: lastTxn?.date || null, daysSince, utilization: utilization.toFixed(2) }
    });
  }
};

const runFullCheck = async () => {
  console.log('🔍 Running full anomaly detection check...');
  const thresholds = {
    utilizationThreshold: await getThresholdValue('under_utilization_threshold', 40),
    timeElapsedThreshold: await getThresholdValue('time_elapsed_threshold', 70),
    spikeThreshold: await getThresholdValue('spending_spike_threshold', 30),
    inactivityDays: await getThresholdValue('inactivity_days', 30)
  };

  const budgets = await Budget.find({ status: 'active' });
  let checksRun = 0, alertsCreated = 0;

  const alertsBefore = await Alert.countDocuments({});
  for (const budget of budgets) {
    await checkUnderUtilization(budget, thresholds);
    await checkOverspending(budget);
    await checkSpendingSpike(budget, thresholds.spikeThreshold);
    await checkInactivity(budget, thresholds.inactivityDays);
    checksRun++;
  }
  const alertsAfter = await Alert.countDocuments({});
  alertsCreated = alertsAfter - alertsBefore;

  console.log(`✅ Anomaly check complete: ${checksRun} budgets checked, ${alertsCreated} new alerts created`);
  return { budgetsChecked: checksRun, newAlerts: alertsCreated };
};

const runAnomalyDetection = async (budgetId) => {
  try {
    const budget = await Budget.findById(budgetId);
    if (!budget || budget.status !== 'active') return;
    const thresholds = {
      utilizationThreshold: await getThresholdValue('under_utilization_threshold', 40),
      timeElapsedThreshold: await getThresholdValue('time_elapsed_threshold', 70),
      spikeThreshold: await getThresholdValue('spending_spike_threshold', 30),
      inactivityDays: await getThresholdValue('inactivity_days', 30)
    };
    await checkOverspending(budget);
    await checkSpendingSpike(budget, thresholds.spikeThreshold);
  } catch (err) {
    console.error('Anomaly detection error:', err.message);
  }
};

module.exports = { runFullCheck, runAnomalyDetection };
