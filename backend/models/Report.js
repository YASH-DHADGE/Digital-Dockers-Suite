const mongoose = require('mongoose');

const reportSchema = mongoose.Schema({
    title: {
        type: String,
        required: true
    },
    generatedBy: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        ref: 'User'
    },
    reportType: {
        type: String,
        enum: ['weekly', 'monthly', 'project', 'custom'],
        default: 'custom'
    },
    dataSource: {
        type: {
            type: String,
            enum: ['manual', 'csv', 'excel', 'database'],
            default: 'manual'
        },
        file: String,
        rawData: mongoose.Schema.Types.Mixed
    },
    insights: {
        summary: String,
        keyMetrics: [{
            name: String,
            value: mongoose.Schema.Types.Mixed,
            trend: String,
            visualization: String
        }],
        recommendations: [String],
        risks: [String]
    },
    format: {
        type: String,
        enum: ['pdf', 'html', 'docx'],
        default: 'html'
    },
    generatedFile: String,
    status: {
        type: String,
        enum: ['generating', 'completed', 'failed'],
        default: 'generating'
    },
    sharedWith: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }]
}, {
    timestamps: true
});

module.exports = mongoose.model('Report', reportSchema);
