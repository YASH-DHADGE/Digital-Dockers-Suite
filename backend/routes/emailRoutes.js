const express = require('express');
const router = express.Router();
const { generateEmail, getEmails, sendEmail, getInbox, getSentEmails, logSentEmail } = require('../controllers/emailController');
const { protect } = require('../middlewares/authMiddleware');

router.post('/generate', protect, generateEmail);
router.post('/send', protect, sendEmail);
router.get('/inbox', protect, getInbox);
router.get('/sent', protect, getSentEmails);
router.post('/sent', protect, logSentEmail);
router.get('/', protect, getEmails);

module.exports = router;
