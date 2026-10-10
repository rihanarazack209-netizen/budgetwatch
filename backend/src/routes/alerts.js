const express = require('express');
const router = express.Router();
const { getAlerts, getAlertStats, markAsRead, markAllRead, resolveAlert, deleteAlert } = require('../controllers/alertController');
const { protect } = require('../middleware/auth');
const { authorize } = require('../middleware/roles');

router.use(protect);
router.get('/stats', getAlertStats);
router.get('/', getAlerts);
router.put('/mark-all-read', markAllRead);
router.put('/:id/read', markAsRead);
router.put('/:id/resolve', authorize('admin', 'finance_officer'), resolveAlert);
router.delete('/:id', authorize('admin'), deleteAlert);

module.exports = router;
