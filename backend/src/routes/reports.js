const express = require('express');
const router = express.Router();
const { getFinancialSummary, generateCSV, generatePDF, getExpenditureReport } = require('../controllers/reportController');
const { protect } = require('../middleware/auth');

router.use(protect);
router.get('/financial-summary', getFinancialSummary);
router.get('/expenditure', getExpenditureReport);
router.get('/export/csv', generateCSV);
router.get('/export/pdf', generatePDF);

module.exports = router;
