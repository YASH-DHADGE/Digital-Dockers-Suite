const mongoose = require('mongoose');

const fileSchema = new mongoose.Schema({
    path: { type: String, required: true },
    repoId: { type: String, required: true },
    loc: { type: Number, default: 0 },
    complexity: { type: Number, default: 0 },
    churnRate: { type: Number, default: 0 }, // Commits in last 90 days
    risk: { type: Number, default: 0 }, // Calculated risk score
    health: { type: Number, default: 100 },
    lastAnalyzed: { type: Date, default: Date.now },
    prHistory: [{ type: mongoose.Schema.Types.ObjectId, ref: 'PullRequest' }],
    blockCount: { type: Number, default: 0 },
    testCoverage: { type: Number, default: 0 },
    activeRefactorTask: { type: String } // Digital Dockers Task ID
}, {
    timestamps: true
});

// Composite index for querying by repo and sorting by risk
fileSchema.index({ repoId: 1, risk: -1 });

module.exports = mongoose.model('File', fileSchema);
