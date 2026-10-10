const express = require('express');
const router = express.Router();
const { getDashboardStats, getDepartmentUtilization, getSpendingTrends, runAnomalyDetectionRoute } = require('../controllers/monitoringController');
const { protect } = require('../middleware/auth');
const { authorize } = require('../middleware/roles');

router.use(protect);
router.get('/dashboard', getDashboardStats);
router.get('/department-utilization', getDepartmentUtilization);
router.get('/spending-trends', getSpendingTrends);
router.post('/run-detection', authorize('admin', 'finance_officer'), runAnomalyDetectionRoute);

module.exports = router;
