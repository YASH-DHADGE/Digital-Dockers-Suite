const express = require('express');
const router = express.Router();
const multer = require('multer');
const axios = require('axios');
const FormData = require('form-data');
const asyncHandler = require('express-async-handler');
const { protect } = require('../middlewares/authMiddleware');

// Use memory storage - file is NOT saved to disk
const memoryStorage = multer.memoryStorage();
const upload = multer({
    storage: memoryStorage,
    limits: { fileSize: 50 * 1024 * 1024 } // 50MB limit
});

// @desc    Direct document analysis via n8n (no DB save)
// @route   POST /api/n8n/analyze
// @access  Private
router.post('/analyze', protect, upload.single('file'), asyncHandler(async (req, res) => {
    if (!req.file) {
        res.status(400);
        throw new Error('Please upload a file');
    }

    console.log(`Received file: ${req.file.originalname}, sending to n8n...`);

    try {
        const formData = new FormData();
        // Append buffer with filename and mimetype
        formData.append('file', req.file.buffer, {
            filename: req.file.originalname,
            contentType: req.file.mimetype
        });

        const n8nResponse = await axios.post(
            'https://rohan-2409.app.n8n.cloud/webhook/document-summary',
            formData,
            {
                headers: {
                    ...formData.getHeaders()
                },
                timeout: 60000 // 60 second timeout
            }
        );

        console.log('n8n response received:', typeof n8nResponse.data);

        // Parse response - adapt based on actual n8n output structure
        let summary = '';
        if (typeof n8nResponse.data === 'object' && n8nResponse.data.summary) {
            summary = n8nResponse.data.summary;
        } else if (typeof n8nResponse.data === 'string') {
            summary = n8nResponse.data;
        } else if (typeof n8nResponse.data === 'object') {
            // Try to find any text-like property
            summary = n8nResponse.data.text || n8nResponse.data.output || n8nResponse.data.result || JSON.stringify(n8nResponse.data, null, 2);
        } else {
            summary = String(n8nResponse.data);
        }

        res.status(200).json({
            success: true,
            summary: summary,
            filename: req.file.originalname
        });

    } catch (error) {
        console.error('n8n Webhook Error:', error.message);
        if (error.response) {
            console.error('n8n Response Status:', error.response.status);
            console.error('n8n Response Data:', error.response.data);
        }
        res.status(500);
        throw new Error(`Failed to analyze document via n8n: ${error.message}`);
    }
}));

module.exports = router;
