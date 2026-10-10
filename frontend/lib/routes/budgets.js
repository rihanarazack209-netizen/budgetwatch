const express = require('express');
const router = express.Router();
const { getBudgets, getBudget, createBudget, updateBudget, deleteBudget, getBudgetSummary } = require('../controllers/budgetController');
const { protect } = require('../middleware/auth');
const { authorize } = require('../middleware/roles');

router.use(protect);
router.get('/summary', getBudgetSummary);
router.get('/', getBudgets);
router.get('/:id', getBudget);
router.post('/', authorize('admin', 'finance_officer'), createBudget);
router.put('/:id', authorize('admin', 'finance_officer'), updateBudget);
router.delete('/:id', authorize('admin'), deleteBudget);

module.exports = router;
