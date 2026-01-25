const CodebaseFile = require('../models/CodebaseFile');
const PullRequest = require('../models/PullRequest');
const MetricsHistory = require('../models/MetricsHistory');

class MetricsCalculator {
    /**
     * Calculate average debt ratio (average risk of all files)
     */
    async calculateDebtRatio(repoId = null) {
        try {
            const query = repoId ? { repoId } : {};

            const fileStats = await CodebaseFile.aggregate([
                { $match: query },
                {
                    $group: {
                        _id: null,
                        avgRisk: { $avg: '$risk' },
                        totalFiles: { $sum: 1 }
                    }
                }
            ]);

            const debtRatio = fileStats[0]?.avgRisk || 0;

            // Save to history
            await MetricsHistory.create({
                metricType: 'debtRatio',
                value: Math.round(debtRatio),
                repoId,
                metadata: {
                    totalFiles: fileStats[0]?.totalFiles || 0
                }
            });

            return Math.round(debtRatio);
        } catch (error) {
            console.error('Error calculating debt ratio:', error);
            return 0;
        }
    }

    /**
     * Calculate PR block rate (last 7 days)
     */
    async calculateBlockRate(repoId = null, days = 7) {
        try {
            const since = new Date();
            since.setDate(since.getDate() - days);

            const query = repoId
                ? { repoId, createdAt: { $gte: since } }
                : { createdAt: { $gte: since } };

            const prStats = await PullRequest.aggregate([
                { $match: query },
                {
                    $group: {
                        _id: null,
                        total: { $sum: 1 },
                        blocked: {
                            $sum: {
                                $cond: [{ $eq: ['$status', 'BLOCK'] }, 1, 0]
                            }
                        }
                    }
                }
            ]);

            const blockRate = prStats[0]?.total
                ? (prStats[0].blocked / prStats[0].total) * 100
                : 0;

            // Save to history
            await MetricsHistory.create({
                metricType: 'blockRate',
                value: Math.round(blockRate),
                repoId,
                metadata: {
                    totalPRs: prStats[0]?.total || 0,
                    blockedPRs: prStats[0]?.blocked || 0,
                    days
                }
            });

            return Math.round(blockRate);
        } catch (error) {
            console.error('Error calculating block rate:', error);
            return 0;
        }
    }

    /**
     * Identify critical hotspots (files with risk > threshold)
     */
    async identifyCriticalHotspots(repoId = null, threshold = 70) {
        try {
            const query = repoId
                ? { repoId, risk: { $gt: threshold } }
                : { risk: { $gt: threshold } };

            const hotspots = await CodebaseFile.find(query)
                .sort({ risk: -1 })
                .limit(20);

            const hotspotCount = hotspots.length;

            // Save to history
            await MetricsHistory.create({
                metricType: 'hotspots',
                value: hotspotCount,
                repoId,
                metadata: {
                    threshold,
                    topHotspots: hotspots.slice(0, 5).map(h => ({
                        path: h.path,
                        risk: h.risk
                    }))
                }
            });

            return {
                count: hotspotCount,
                hotspots
            };
        } catch (error) {
            console.error('Error identifying hotspots:', error);
            return { count: 0, hotspots: [] };
        }
    }

    /**
     * Calculate risk reduced (sum of positive health deltas in passed PRs)
     */
    async calculateRiskReduced(repoId = null, days = 30) {
        try {
            const since = new Date();
            since.setDate(since.getDate() - days);

            const query = repoId
                ? { repoId, status: 'PASS', createdAt: { $gte: since } }
                : { status: 'PASS', createdAt: { $gte: since } };

            const riskStats = await PullRequest.aggregate([
                { $match: query },
                {
                    $group: {
                        _id: null,
                        reduced: {
                            $sum: '$analysisResults.complexity.healthScoreDelta'
                        },
                        count: { $sum: 1 }
                    }
                }
            ]);

            const riskReduced = Math.max(0, riskStats[0]?.reduced || 0);

            // Save to history
            await MetricsHistory.create({
                metricType: 'riskReduced',
                value: Math.round(riskReduced),
                repoId,
                metadata: {
                    passedPRs: riskStats[0]?.count || 0,
                    days
                }
            });

            return Math.round(riskReduced);
        } catch (error) {
            console.error('Error calculating risk reduced:', error);
            return 0;
        }
    }

    /**
     * Get all metrics summary
     */
    async getAllMetrics(repoId = null) {
        try {
            const [debtRatio, blockRate, hotspots, riskReduced] = await Promise.all([
                this.calculateDebtRatio(repoId),
                this.calculateBlockRate(repoId),
                this.identifyCriticalHotspots(repoId),
                this.calculateRiskReduced(repoId)
            ]);

            return {
                debtRatio,
                blockRate,
                hotspotCount: hotspots.count,
                riskReduced,
                timestamp: new Date()
            };
        } catch (error) {
            console.error('Error getting all metrics:', error);
            return {
                debtRatio: 0,
                blockRate: 0,
                hotspotCount: 0,
                riskReduced: 0,
                timestamp: new Date()
            };
        }
    }

    /**
     * Get metric history/trend
     */
    async getMetricTrend(metricType, repoId = null, days = 30) {
        try {
            const since = new Date();
            since.setDate(since.getDate() - days);

            const query = {
                metricType,
                calculatedAt: { $gte: since }
            };

            if (repoId) {
                query.repoId = repoId;
            }

            const history = await MetricsHistory.find(query)
                .sort({ calculatedAt: 1 })
                .select('value calculatedAt metadata');

            return history;
        } catch (error) {
            console.error('Error getting metric trend:', error);
            return [];
        }
    }
}

module.exports = MetricsCalculator;
