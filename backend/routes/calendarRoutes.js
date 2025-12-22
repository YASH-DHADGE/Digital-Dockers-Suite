const express = require('express');
const router = express.Router();
const { getGoogleAuthUrl, googleCallback, getEvents } = require('../controllers/calendarController');
const { protect } = require('../middlewares/authMiddleware');

router.get('/auth', protect, getGoogleAuthUrl);
router.get('/callback', googleCallback);
router.get('/events', protect, getEvents); // Changed from /sync POST to /events GET

module.exports = router;
