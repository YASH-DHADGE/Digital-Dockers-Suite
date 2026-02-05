const mongoose = require('mongoose');

/**
 * CodebaseFile Model
 * Stores per-file analysis results including complexity, churn, and risk scores
 * Enhanced with function-level details and Gatekeeper tracking
 */
const codebaseFileSchema = new mongoose.Schema({
    repoId: {
        type: String,
        required: true
    },
    path: {
        type: String,
        required: true
    },
    sha: {
        type: String,  // Git hash for cache invalidation
        default: null
    },
    loc: {
        type: Number,
        default: 0
    },
    language: {
        type: String,
        enum: ['javascript', 'typescript', 'jsx', 'tsx', 'python', 'java', 'go', 'ruby', 'php', 'cpp', 'c', 'rust', 'swift', 'kotlin', 'csharp', 'html', 'css', 'scss', 'json', 'yaml', 'other'],
        default: 'javascript'
    },

    // Enhanced complexity object
    complexity: {
        cyclomatic: { type: Number, default: 0 },
        cognitive: { type: Number, default: 0 },
        normalized: { type: Number, default: 0 },  // 0-100 percentile
        healthScore: { type: Number, default: 100 }  // 100 - normalized
    },

    // Enhanced churn object
    churn: {
        totalCommits: { type: Number, default: 0 },
        recentCommits: { type: Number, default: 0 },  // Last 90 days
        churnRate: { type: Number, default: 0 },  // Commits per week
        lastModified: { type: Date },
        topContributors: [{
            email: String,
            name: String,
            commits: Number
        }]
    },

    // Enhanced risk object
    risk: {
        score: { type: Number, default: 0 },  // 0-100
        category: {
            type: String,
            enum: ['healthy', 'warning', 'critical'],
            default: 'healthy'
        },
        color: {
            type: String,
            default: '#44FF44'  // Green
        },
        confidence: {
            type: String,
            enum: ['low', 'medium', 'high'],
            default: 'low'
        }
    },

    // Function-level analysis
    functions: [{
        name: { type: String },
        complexity: { type: Number, default: 0 },
        startLine: { type: Number },
        endLine: { type: Number },
        params: { type: Number, default: 0 }
    }],

    // PR history tracking
    prHistory: [{
        prNumber: Number,
        prId: mongoose.Schema.Types.ObjectId,
        action: { type: String, enum: ['modified', 'created', 'deleted'] },
        timestamp: Date,
        healthDelta: Number  // Positive = improved, Negative = worsened
    }],

    // Gatekeeper block tracking
    blockCount: { type: Number, default: 0 },

    // Active refactor task reference
    activeRefactorTask: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'RefactorTask'
    },

    lastAnalyzed: {
        type: Date,
        default: Date.now
    },

    dependencies: [String],

    // Historical metrics for trend analysis
    historicalMetrics: [{
        date: { type: Date, default: Date.now },
        complexity: Number,
        loc: Number,
        risk: Number
    }],

    // AI-generated recommendations
    recommendations: [{
        type: { type: String, enum: ['refactor', 'split', 'document', 'test', 'review'] },
        message: String,
        priority: { type: String, enum: ['low', 'medium', 'high'] },
        generatedAt: Date
    }]
}, {
    timestamps: true
});

// Compound index for efficient queries
codebaseFileSchema.index({ repoId: 1, path: 1 }, { unique: true });
codebaseFileSchema.index({ repoId: 1, 'risk.score': -1 });  // For hotspot queries
codebaseFileSchema.index({ 'risk.category': 1, lastAnalyzed: -1 });

// Calculate risk before saving
codebaseFileSchema.pre('save', function (next) {
    // Get values from nested objects or legacy flat fields
    const complexityVal = this.complexity?.cyclomatic || this.complexity || 0;
    const churnVal = this.churn?.recentCommits || this.churnRate || 0;

    // Calculate normalized risk (0-100)
    const rawRisk = (complexityVal * 0.6) + (churnVal * 0.4);
    const normalizedRisk = Math.min(100, rawRisk);

    // Apply hotspot amplification
    const isHotspot = complexityVal > 70 && churnVal > 70;
    const finalRisk = isHotspot ? Math.min(100, normalizedRisk * 1.2) : normalizedRisk;

    // Set risk object
    this.risk = this.risk || {};
    this.risk.score = finalRisk;
    this.risk.category = finalRisk > 70 ? 'critical' : finalRisk > 40 ? 'warning' : 'healthy';
    this.risk.color = finalRisk > 70 ? '#FF4444' : finalRisk > 40 ? '#FFAA00' : '#44FF44';

    // Calculate confidence
    const hasEnoughCommits = (this.churn?.totalCommits || 0) > 10;
    const hasEnoughLoc = this.loc > 100;
    this.risk.confidence = (hasEnoughCommits && hasEnoughLoc) ? 'high' :
        (hasEnoughCommits || hasEnoughLoc) ? 'medium' : 'low';

    next();
});

// Method to get complexity breakdown
codebaseFileSchema.methods.getComplexityBreakdown = function () {
    if (!this.functions || this.functions.length === 0) {
        return { functions: [], maxComplexity: 0, avgComplexity: 0 };
    }

    const sorted = [...this.functions].sort((a, b) => b.complexity - a.complexity);
    const sum = sorted.reduce((acc, f) => acc + f.complexity, 0);

    return {
        functions: sorted.slice(0, 10),  // Top 10 complex functions
        maxComplexity: sorted[0]?.complexity || 0,
        avgComplexity: sum / sorted.length
    };
};

module.exports = mongoose.model('CodebaseFile', codebaseFileSchema);
