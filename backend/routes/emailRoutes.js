const express = require('express');
const router = express.Router();
const { generateEmail, getEmails, sendEmail, getInbox } = require('../controllers/emailController');
const { protect } = require('../middlewares/authMiddleware');

router.post('/generate', protect, generateEmail);
router.post('/send', protect, sendEmail);
router.get('/inbox', protect, getInbox);
router.get('/', protect, getEmails);

module.exports = router;
