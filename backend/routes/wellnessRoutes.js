const express = require('express');
const router = express.Router();
const { submitCheckin, getWellnessHistory } = require('../controllers/wellnessController');
const { protect } = require('../middlewares/authMiddleware');

router.post('/checkin', protect, submitCheckin);
router.get('/history', protect, getWellnessHistory);

module.exports = router;
