const express = require('express');
const router = express.Router();
const { uploadDocument, analyzeDocument, getDocuments } = require('../controllers/documentController');
const { protect } = require('../middlewares/authMiddleware');
const upload = require('../middlewares/uploadMiddleware');

router.post('/upload', protect, upload.single('file'), uploadDocument);
router.post('/:id/analyze', protect, analyzeDocument);
router.get('/', protect, getDocuments);

module.exports = router;
