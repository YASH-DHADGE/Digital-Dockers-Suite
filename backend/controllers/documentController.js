const asyncHandler = require('express-async-handler');
const Document = require('../models/Document');

// @desc    Upload Document
// @route   POST /api/documents/upload
// @access  Private
const uploadDocument = asyncHandler(async (req, res) => {
    if (!req.file) {
        res.status(400);
        throw new Error('Please upload a file');
    }

    const document = await Document.create({
        title: req.body.title || req.file.originalname,
        uploadedBy: req.user._id,
        file: {
            filename: req.file.filename,
            filepath: req.file.path,
            mimetype: req.file.mimetype,
            size: req.file.size
        },
        type: req.body.type || 'general',
        status: 'processing'
    });

    // Determine type for specific analysis (contract vs policy)
    // Trigger async analysis here...

    res.status(201).json(document);
});

// @desc    Process Document Analysis
// @route   POST /api/documents/:id/analyze
// @access  Private
const analyzeDocument = asyncHandler(async (req, res) => {
    const document = await Document.findById(req.params.id);
    if (!document) {
        res.status(404);
        throw new Error('Document not found');
    }

    // Fake AI Analysis
    document.analysis = {
        summary: "Document summary...",
        keyPoints: ["Clause 1", "Clause 2"],
        compliance: { status: 'compliant', issues: [] },
        risks: []
    };
    document.status = 'completed';
    await document.save();

    res.status(200).json(document);
});

// @desc    Get documents
// @route   GET /api/documents
// @access  Private
const getDocuments = asyncHandler(async (req, res) => {
    const documents = await Document.find({ uploadedBy: req.user._id }).sort('-createdAt');
    res.status(200).json(documents);
});

module.exports = {
    uploadDocument,
    analyzeDocument,
    getDocuments
};
