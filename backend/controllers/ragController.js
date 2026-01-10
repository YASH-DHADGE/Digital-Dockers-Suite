const asyncHandler = require('express-async-handler');
const Document = require('../models/Document');
const DocumentAnalysis = require('../models/DocumentAnalysis');
const { parseDocument, summarizeDocument, chatWithDocument } = require('../services/ragService');
const fs = require('fs');
const axios = require('axios');
const FormData = require('form-data');

// @desc    Analyze Document (Parse & Summarize with n8n)
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

    // 3. Parse File (Keep for Chat functionality)
    const filePath = document.file.filepath; // Assumes local path exists

    if (!fs.existsSync(filePath)) {
        res.status(404);
        throw new Error('File not found on server storage');
    }

    console.log(`Parsing document for chat context: ${filePath}`);
    const text = await parseDocument(filePath, document.file.mimetype);

    // 4. Generate Summary via n8n Webhook
    console.log('Sending file to n8n for analysis...');

    let summary = '';

    try {
        const formData = new FormData();
        formData.append('file', fs.createReadStream(filePath));

        const n8nResponse = await axios.post(
            'https://rohan-2409.app.n8n.cloud/webhook-test/document-summary',
            formData,
            {
                headers: {
                    ...formData.getHeaders() // Important for multipart/form-data boundary
                }
            }
        );

        // Assuming n8n returns the summary directly as a JSON object or string
        // Adjust based on actual n8n response structure. 
        // If n8n returns { summary: "..." } or just "..."
        if (typeof n8nResponse.data === 'object' && n8nResponse.data.summary) {
            summary = n8nResponse.data.summary;
        } else if (typeof n8nResponse.data === 'string') {
            summary = n8nResponse.data;
        } else {
            // Fallback if structure is unknown, just dump the data stringified
            summary = JSON.stringify(n8nResponse.data);
        }

        console.log('n8n Summary received successfully.');

    } catch (error) {
        console.error('n8n Webhook Error:', error.message);
        // Fallback to local summary if n8n fails (optional, or could just throw)
        // For now, let's try local if n8n fails, or better yet, just report the error to not break flow if local is desired.
        // But the user *requested* n8n integration. So if it fails, maybe we should error.
        // Let's fallback to local 'summarizeDocument' if n8n fails, for robustness.
        console.log('Falling back to local Ollama summarization...');

        if (!text || text.length < 50) {
            res.status(400);
            throw new Error('Document text is too short or could not be extracted.');
        }
        summary = await summarizeDocument(text);
    }

    // 5. Save Analysis
    analysis = await DocumentAnalysis.create({
        document: id,
        user: req.user._id,
        extractedText: text, // Needed for Chat
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
