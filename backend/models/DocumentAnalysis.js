const mongoose = require('mongoose');

const DocumentAnalysisSchema = new mongoose.Schema({
    document: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Document',
        required: true
    },
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    extractedText: {
        type: String,
        required: true
    },
    summary: {
        type: String
    },
    chunks: [{
        type: String
    }],
    analyzedAt: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model('DocumentAnalysis', DocumentAnalysisSchema);
