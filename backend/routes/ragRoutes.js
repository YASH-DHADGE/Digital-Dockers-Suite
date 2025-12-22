const express = require('express');
const router = express.Router();
const { analyzeDocumentController, chatDocumentController } = require('../controllers/ragController');
const { protect } = require('../middlewares/authMiddleware');

router.post('/analyze/:id', protect, analyzeDocumentController);
router.post('/chat/:id', protect, chatDocumentController);

module.exports = router;
