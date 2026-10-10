const express = require('express');
const router = express.Router();
const { getUsers, createUser, updateUser, deactivateUser, getAuditLogs, getThresholds, updateThresholds, getSystemStats } = require('../controllers/adminController');
const { protect } = require('../middleware/auth');
const { authorize } = require('../middleware/roles');

router.use(protect, authorize('admin'));
router.get('/stats', getSystemStats);
router.get('/users', getUsers);
router.post('/users', createUser);
router.put('/users/:id', updateUser);
router.delete('/users/:id', deactivateUser);
router.get('/audit-logs', getAuditLogs);
router.get('/thresholds', getThresholds);
router.put('/thresholds', updateThresholds);

module.exports = router;
