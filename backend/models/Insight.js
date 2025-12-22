const mongoose = require('mongoose');

const insightSchema = mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        ref: 'User'
    },
    title: {
        type: String,
        required: true
    },
    sourceFile: {
        filename: String,
        filepath: String,
        mimetype: String
    },
    sourceType: {
        type: String,
        enum: ['csv', 'excel', 'json']
    },
    parsedData: mongoose.Schema.Types.Mixed,
    analysis: {
        summary: String,
        trends: [{
            metric: String,
            direction: {
                type: String,
                enum: ['up', 'down', 'stable']
            },
            percentage: Number,
            significance: String
        }],
        anomalies: [String],
        correlations: [String],
        predictions: [String],
        visualizations: [{
            type: {
                type: String,
                enum: ['line', 'bar', 'pie', 'scatter']
            },
            data: mongoose.Schema.Types.Mixed,
            title: String
        }]
    },
    sharedWith: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }],
    status: {
        type: String,
        enum: ['processing', 'completed', 'failed'],
        default: 'processing'
    }
}, {
    timestamps: true
});

module.exports = mongoose.model('Insight', insightSchema);
