const express = require('express');
const router = express.Router();
const { protect } = require('../middlewares/authMiddleware');
const { generatePptx, healthCheck } = require('../controllers/pptController');

// @desc    Generate PPTX from presentation data
// @route   POST /api/ppt/generate
// @access  Private
router.post('/generate', protect, generatePptx);

// @desc    Health check for PPT service
// @route   GET /api/ppt/health
// @access  Public
router.get('/health', healthCheck);

module.exports = router;
