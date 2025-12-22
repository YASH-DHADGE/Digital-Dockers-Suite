const express = require('express');
const router = express.Router();
const { uploadData, getInsights } = require('../controllers/insightsController');
const { protect } = require('../middlewares/authMiddleware');
const upload = require('../middlewares/uploadMiddleware');

router.post('/upload', protect, upload.single('file'), uploadData);
router.get('/', protect, getInsights);

module.exports = router;
