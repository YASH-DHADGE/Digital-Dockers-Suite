const mongoose = require('mongoose');

/**
 * AnalysisSnapshot Model
 * Time-series data for tracking technical debt trends across sprints
 * Used for time-travel visualization in Codebase MRI
 */
const analysisSnapshotSchema = new mongoose.Schema({
    repoId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Repository',
        required: true
    },
    sprint: {
        type: Number,
        required: true
    },
    timestamp: {
        type: Date,
        default: Date.now
    },
    aggregateMetrics: {
        totalFiles: { type: Number, default: 0 },
        avgComplexity: { type: Number, default: 0 },
        avgChurn: { type: Number, default: 0 },
        avgRisk: { type: Number, default: 0 },
        hotspotCount: { type: Number, default: 0 },      // risk > 70
        warningCount: { type: Number, default: 0 },       // risk 40-70
        healthyCount: { type: Number, default: 0 },       // risk < 40
        totalLoc: { type: Number, default: 0 },
        healthScore: { type: Number, default: 100 }       // 0-100 overall
    },
    // Store top hotspots for quick access
    topHotspots: [{
        path: String,
        risk: Number,
        complexity: Number,
        churnRate: Number,
        loc: Number
    }],
    // Full file snapshot for time-travel (limited to high-risk files to save space)
    files: [{
        path: { type: String, required: true },
        risk: { type: Number, default: 0 },
        complexity: { type: Number, default: 0 },
        churnRate: { type: Number, default: 0 },
        loc: { type: Number, default: 0 },
        category: {
            type: String,
            enum: ['healthy', 'warning', 'critical'],
            default: 'healthy'
        }
    }],
    // Comparison with previous snapshot
    comparison: {
        riskDelta: { type: Number, default: 0 },
        hotspotsAdded: { type: Number, default: 0 },
        hotspotsResolved: { type: Number, default: 0 },
        healthScoreDelta: { type: Number, default: 0 }
    },
    // Notable events during this sprint
    events: [{
        type: { type: String, enum: ['pr_blocked', 'hotspot_created', 'task_completed', 'refactor_completed'] },
        description: String,
        fileId: mongoose.Schema.Types.ObjectId,
        timestamp: Date
    }]
}, {
    timestamps: true
});

// Indexes for efficient time-travel queries
analysisSnapshotSchema.index({ repoId: 1, sprint: -1 });
analysisSnapshotSchema.index({ repoId: 1, timestamp: -1 });

// Static method to get latest snapshot for a repo
analysisSnapshotSchema.statics.getLatest = async function (repoId) {
    return this.findOne({ repoId }).sort({ sprint: -1 });
};

// Static method to get snapshots for time range
analysisSnapshotSchema.statics.getRange = async function (repoId, startSprint, endSprint) {
    return this.find({
        repoId,
        sprint: { $gte: startSprint, $lte: endSprint }
    }).sort({ sprint: 1 });
};

// Method to calculate comparison with previous snapshot
analysisSnapshotSchema.methods.calculateComparison = async function () {
    const previous = await this.constructor.findOne({
        repoId: this.repoId,
        sprint: this.sprint - 1
    });

    if (!previous) {
        this.comparison = { riskDelta: 0, hotspotsAdded: 0, hotspotsResolved: 0, healthScoreDelta: 0 };
        return;
    }

    this.comparison = {
        riskDelta: this.aggregateMetrics.avgRisk - previous.aggregateMetrics.avgRisk,
        hotspotsAdded: Math.max(0, this.aggregateMetrics.hotspotCount - previous.aggregateMetrics.hotspotCount),
        hotspotsResolved: Math.max(0, previous.aggregateMetrics.hotspotCount - this.aggregateMetrics.hotspotCount),
        healthScoreDelta: this.aggregateMetrics.healthScore - previous.aggregateMetrics.healthScore
    };
};

module.exports = mongoose.model('AnalysisSnapshot', analysisSnapshotSchema);
