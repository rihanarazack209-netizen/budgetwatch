const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const { getExpenditures, getExpenditure, createExpenditure, updateExpenditure, deleteExpenditure, approveExpenditure, rejectExpenditure, getCategoryStats } = require('../controllers/expenditureController');
const { protect } = require('../middleware/auth');
const { authorize } = require('../middleware/roles');

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, 'uploads/'),
  filename: (req, file, cb) => cb(null, `${Date.now()}-${file.originalname.replace(/\s+/g, '-')}`)
});
const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
  fileFilter: (req, file, cb) => {
    const allowed = /pdf|jpg|jpeg|png|doc|docx|xlsx/;
    const ext = path.extname(file.originalname).toLowerCase();
    if (allowed.test(ext)) cb(null, true);
    else cb(new Error('Only PDF, images, Word and Excel files allowed'));
  }
});

router.use(protect);
router.get('/categories/stats', getCategoryStats);
router.get('/', getExpenditures);
router.get('/:id', getExpenditure);
router.post('/', authorize('admin', 'finance_officer'), upload.single('supportingDocument'), createExpenditure);
router.put('/:id', authorize('admin', 'finance_officer'), updateExpenditure);
router.delete('/:id', authorize('admin', 'finance_officer'), deleteExpenditure);
router.put('/:id/approve', authorize('admin', 'finance_officer'), approveExpenditure);
router.put('/:id/reject', authorize('admin', 'finance_officer'), rejectExpenditure);

module.exports = router;
