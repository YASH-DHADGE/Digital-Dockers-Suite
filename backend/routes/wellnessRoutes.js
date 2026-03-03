const express = require('express');
const router = express.Router();
const { submitCheckin, getWellnessHistory, counselorChat, completeJourney } = require('../controllers/wellnessController');
const { protect } = require('../middlewares/authMiddleware');

router.post('/checkin', protect, submitCheckin);
router.get('/history', protect, getWellnessHistory);
router.post('/counselor', protect, counselorChat);
router.post('/journey/complete', protect, completeJourney);

module.exports = router;
