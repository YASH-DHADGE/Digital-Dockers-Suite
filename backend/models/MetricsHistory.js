const mongoose = require('mongoose');

const metricsHistorySchema = new mongoose.Schema({
    metricType: {
        type: String,
        required: true,
        enum: ['debtRatio', 'blockRate', 'hotspots', 'riskReduced'],
        index: true
    },
    value: {
        type: Number,
        required: true
    },
    calculatedAt: {
        type: Date,
        default: Date.now,
        index: true
    },
    metadata: {
        type: Object,
        default: {}
    },
    repoId: {
        type: String,
        index: true
    }
}, {
    timestamps: true
});

// Compound index for efficient time-series queries
metricsHistorySchema.index({ metricType: 1, calculatedAt: -1 });
metricsHistorySchema.index({ repoId: 1, metricType: 1, calculatedAt: -1 });

module.exports = mongoose.model('MetricsHistory', metricsHistorySchema);
