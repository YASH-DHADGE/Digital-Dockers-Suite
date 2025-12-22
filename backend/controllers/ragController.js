const asyncHandler = require('express-async-handler');
const Document = require('../models/Document');
const DocumentAnalysis = require('../models/DocumentAnalysis');
const { parseDocument, summarizeDocument, chatWithDocument } = require('../services/ragService');
const fs = require('fs');

// @desc    Analyze Document (Parse & Summarize)
// @route   POST /api/rag/analyze/:id
// @access  Private
const analyzeDocumentController = asyncHandler(async (req, res) => {
    const { id } = req.params;

    // 1. Find Document Metadata
    const document = await Document.findById(id);
    if (!document) {
        res.status(404);
        throw new Error('Document not found');
    }

    // 2. Check if already analyzed
    let analysis = await DocumentAnalysis.findOne({ document: id });
    if (analysis) {
        return res.status(200).json(analysis);
    }

    // 3. Parse File
    const filePath = document.file.filepath; // Assumes local path exists

    if (!fs.existsSync(filePath)) {
        res.status(404);
        throw new Error('File not found on server storage');
    }

    console.log(`Parsing document: ${filePath}`);
    const text = await parseDocument(filePath, document.file.mimetype);

    // 4. Generate Summary
    console.log('Generating summary...');
    // If Text is empty?
    if (!text || text.length < 50) {
        res.status(400);
        throw new Error('Document text is too short or could not be extracted.');
    }

    const summary = await summarizeDocument(text);

    // 5. Save Analysis
    analysis = await DocumentAnalysis.create({
        document: id,
        user: req.user._id,
        extractedText: text,
        summary: summary,
        analyzedAt: Date.now()
    });

    res.status(200).json(analysis);
});

// @desc    Chat with Document
// @route   POST /api/rag/chat/:id
// @access  Private
const chatDocumentController = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { question } = req.body;

    if (!question) {
        res.status(400);
        throw new Error('Question is required');
    }

    // 1. Find Analysis
    const analysis = await DocumentAnalysis.findOne({ document: id });
    if (!analysis) {
        res.status(404);
        throw new Error('Analysis not found. Please analyze the document first.');
    }

    // 2. Chat
    const answer = await chatWithDocument(analysis.extractedText, question);

    res.status(200).json({ answer });
});

module.exports = {
    analyzeDocumentController,
    chatDocumentController
};
