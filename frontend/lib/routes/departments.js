const express = require('express');
const router = express.Router();
const { getDepartments, getDepartment, createDepartment, updateDepartment, deleteDepartment } = require('../controllers/departmentController');
const { protect } = require('../middleware/auth');
const { authorize } = require('../middleware/roles');

router.use(protect);
router.get('/', getDepartments);
router.get('/:id', getDepartment);
router.post('/', authorize('admin'), createDepartment);
router.put('/:id', authorize('admin', 'finance_officer'), updateDepartment);
router.delete('/:id', authorize('admin'), deleteDepartment);

module.exports = router;
