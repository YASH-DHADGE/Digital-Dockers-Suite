const simpleGit = require('simple-git');
const path = require('path');

class ChurnAnalysisService {
    constructor(repoPath) {
        this.git = simpleGit(repoPath);
        this.repoPath = repoPath;
    }

    /**
     * Get commit count for a file in the last N days
     */
    async getFileChurnRate(filePath, days = 90) {
        try {
            const since = new Date();
            since.setDate(since.getDate() - days);

            const log = await this.git.log({
                file: filePath,
                '--since': since.toISOString()
            });

            return log.total || 0;
        } catch (error) {
            console.error('Error getting churn rate for', filePath, ':', error.message);
            return 0;
        }
    }

    /**
     * Get churn rates for multiple files
     */
    async getChurnRates(filePaths, days = 90) {
        const results = {};

        for (const filePath of filePaths) {
            results[filePath] = await this.getFileChurnRate(filePath, days);
        }

        return results;
    }

    /**
     * Get all files with their churn rates
     */
    async getAllFilesChurn(days = 90) {
        try {
            const since = new Date();
            since.setDate(since.getDate() - days);

            // Get all files that have been modified
            const log = await this.git.log({
                '--since': since.toISOString(),
                '--name-only': null,
                '--pretty': 'format:'
            });

            // Count occurrences of each file
            const fileChurn = {};
            const output = log.all.join('\n');
            const files = output.split('\n').filter(f => f.trim());

            files.forEach(file => {
                fileChurn[file] = (fileChurn[file] || 0) + 1;
            });

            return fileChurn;
        } catch (error) {
            console.error('Error getting all files churn:', error.message);
            return {};
        }
    }

    /**
     * Identify hotspot files (high churn + high complexity)
     */
    identifyHotspots(churnData, complexityData, churnThreshold = 5, complexityThreshold = 15) {
        const hotspots = [];

        for (const [filePath, churnRate] of Object.entries(churnData)) {
            const complexity = complexityData[filePath]?.complexity || 0;

            if (churnRate >= churnThreshold && complexity >= complexityThreshold) {
                const risk = churnRate * complexity;
                hotspots.push({
                    path: filePath,
                    churnRate,
                    complexity,
                    risk
                });
            }
        }

        return hotspots.sort((a, b) => b.risk - a.risk);
    }

    /**
     * Get file modification patterns (who, when, how often)
     */
    async getFileModificationPattern(filePath, days = 90) {
        try {
            const since = new Date();
            since.setDate(since.getDate() - days);

            const log = await this.git.log({
                file: filePath,
                '--since': since.toISOString()
            });

            const authors = {};
            const timeline = [];

            log.all.forEach(commit => {
                // Count by author
                authors[commit.author_name] = (authors[commit.author_name] || 0) + 1;

                // Timeline
                timeline.push({
                    date: commit.date,
                    author: commit.author_name,
                    message: commit.message
                });
            });

            return {
                totalCommits: log.total,
                authors,
                timeline,
                primaryAuthor: Object.entries(authors).sort((a, b) => b[1] - a[1])[0]?.[0]
            };
        } catch (error) {
            console.error('Error getting modification pattern:', error.message);
            return {
                totalCommits: 0,
                authors: {},
                timeline: [],
                primaryAuthor: null
            };
        }
    }

    /**
     * Calculate risk score based on churn and complexity
     */
    calculateRiskScore(churnRate, complexity) {
        // Risk = churn * complexity
        // Normalize to 0-100 scale
        const rawRisk = churnRate * complexity;

        // Apply logarithmic scaling to prevent extreme values
        const normalizedRisk = Math.min(100, Math.log10(rawRisk + 1) * 20);

        return Math.round(normalizedRisk);
    }

    /**
     * Get files changed in a specific commit or PR
     */
    async getFilesChangedInCommit(commitHash) {
        try {
            const diff = await this.git.show([
                commitHash,
                '--name-only',
                '--pretty=format:'
            ]);

            return diff.split('\n').filter(f => f.trim());
        } catch (error) {
            console.error('Error getting files changed:', error.message);
            return [];
        }
    }

    /**
     * Get churn trend over time for a file
     */
    async getChurnTrend(filePath, intervals = 6, intervalDays = 30) {
        const trend = [];

        for (let i = 0; i < intervals; i++) {
            const endDate = new Date();
            endDate.setDate(endDate.getDate() - (i * intervalDays));

            const startDate = new Date(endDate);
            startDate.setDate(startDate.getDate() - intervalDays);

            try {
                const log = await this.git.log({
                    file: filePath,
                    '--since': startDate.toISOString(),
                    '--until': endDate.toISOString()
                });

                trend.unshift({
                    period: `${startDate.toLocaleDateString()} - ${endDate.toLocaleDateString()}`,
                    commits: log.total || 0
                });
            } catch (error) {
                trend.unshift({
                    period: `${startDate.toLocaleDateString()} - ${endDate.toLocaleDateString()}`,
                    commits: 0
                });
            }
        }

        return trend;
    }
}

module.exports = ChurnAnalysisService;
