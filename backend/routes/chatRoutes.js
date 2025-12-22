const express = require('express');
const router = express.Router();
const { getChatHistory } = require('../controllers/chatController');
const { protect } = require('../middlewares/authMiddleware');

router.get('/history/:room', protect, getChatHistory);

module.exports = router;
