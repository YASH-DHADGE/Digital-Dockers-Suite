const mongoose = require('mongoose');

const emailSchema = mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        ref: 'User'
    },
    type: {
        type: String,
        enum: ['smart_email', 'report'],
        default: 'smart_email'
    },
    input: {
        bulletPoints: [String],
        context: String,
        tone: {
            type: String,
            enum: ['formal', 'casual', 'persuasive', 'friendly', 'urgent'],
            default: 'formal'
        }
    },
    generatedContent: {
        subject: String,
        body: String,
        signature: String
    },
    recipients: [String],
    status: {
        type: String,
        enum: ['draft', 'sent'],
        default: 'draft'
    },
    sentAt: Date,
    metadata: {
        wordCount: Number,
        estimatedReadTime: Number
    }
}, {
    timestamps: true
});

module.exports = mongoose.model('Email', emailSchema);
