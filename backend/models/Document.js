const mongoose = require('mongoose');

const documentSchema = mongoose.Schema({
    title: {
        type: String,
        required: true
    },
    uploadedBy: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        ref: 'User'
    },
    file: {
        filename: String,
        filepath: String,
        mimetype: String,
        size: Number
    },
    type: {
        type: String,
        enum: ['contract', 'policy', 'general'],
        default: 'general'
    },
    analysis: {
        summary: String,
        keyPoints: [String],
        entities: [{
            type: { type: String }, // 'type' is reserved in mongoose, careful nesting
            value: String,
            context: String
        }],
        compliance: {
            status: {
                type: String,
                enum: ['compliant', 'non_compliant', 'review_required']
            },
            issues: [String],
            recommendations: [String]
        },
        risks: [{
            level: {
                type: String,
                enum: ['low', 'medium', 'high', 'critical']
            },
            description: String,
            clause: String,
            recommendation: String
        }],
        obligations: [String],
        keyDates: [{
            date: Date,
            description: String
        }]
    },
    language: String,
    extractedText: String,
    status: {
        type: String,
        enum: ['processing', 'completed', 'failed'],
        default: 'processing'
    },
    tags: [String],
    sharedWith: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }]
}, {
    timestamps: true
});

module.exports = mongoose.model('Document', documentSchema);
