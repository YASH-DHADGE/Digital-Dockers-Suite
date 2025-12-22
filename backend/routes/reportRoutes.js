const express = require('express');
const router = express.Router();
const { generateReport, getReports } = require('../controllers/reportController');
const { protect } = require('../middlewares/authMiddleware');

router.post('/generate', protect, generateReport);
router.get('/', protect, getReports);

module.exports = router;
