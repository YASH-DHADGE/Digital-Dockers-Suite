const mongoose = require('mongoose');

const codebaseFileSchema = new mongoose.Schema({
    repoId: {
        type: String,
        required: true,
        index: true
    },
    path: {
        type: String,
        required: true,
        index: true
    },
    loc: {
        type: Number,
        default: 0
    },
    complexity: {
        type: Number,
        default: 0
    },
    churnRate: {
        type: Number,
        default: 0,
        description: 'Number of commits in last 90 days'
    },
    risk: {
        type: Number,
        default: 0,
        description: 'Calculated as complexity * churnRate'
    },
    lastAnalyzed: {
        type: Date,
        default: Date.now
    },
    dependencies: [String],
    historicalMetrics: [{
        date: { type: Date, default: Date.now },
        complexity: Number,
        loc: Number,
        risk: Number
    }],
    language: {
        type: String,
        enum: ['javascript', 'typescript', 'jsx', 'tsx', 'python', 'java', 'other'],
        default: 'javascript'
    }
}, {
    timestamps: true
});

// Compound index for efficient queries
codebaseFileSchema.index({ repoId: 1, path: 1 }, { unique: true });
codebaseFileSchema.index({ risk: -1 }); // For hotspot queries

// Calculate risk before saving
codebaseFileSchema.pre('save', function (next) {
    this.risk = this.complexity * this.churnRate;
    next();
});

module.exports = mongoose.model('CodebaseFile', codebaseFileSchema);
