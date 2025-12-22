const express = require('express');
const router = express.Router();
const { analyzeText, getHistory } = require('../controllers/communicationController');
const { protect } = require('../middlewares/authMiddleware');

router.post('/analyze-text', protect, analyzeText);
router.get('/history', protect, getHistory);

module.exports = router;
