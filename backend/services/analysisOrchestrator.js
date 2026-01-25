const SyntaxAnalysisService = require('./syntaxAnalysisService');
const ComplexityAnalysisService = require('./complexityAnalysisService');
const ChurnAnalysisService = require('./churnAnalysisService');
const DependencyAnalysisService = require('./dependencyAnalysisService');
const { analyzeCodeSemantic } = require('./openaiService');
const PullRequest = require('../models/PullRequest');
const CodebaseFile = require('../models/CodebaseFile');

class AnalysisOrchestrator {
    constructor(repoPath = null) {
        this.syntaxService = new SyntaxAnalysisService();
        this.complexityService = new ComplexityAnalysisService();
        this.churnService = repoPath ? new ChurnAnalysisService(repoPath) : null;
        this.dependencyService = new DependencyAnalysisService();
    }

    /**
     * Analyze a single PR comprehensively
     */
    async analyzePR(prData, filesChanged, io = null) {
        try {
            console.log(`Starting analysis for PR #${prData.prNumber}...`);

            // 1. Syntax Analysis
            const syntaxResults = await this.syntaxService.analyzePRDiff(filesChanged);

            // 2. Complexity Analysis
            const complexityResults = await this.analyzeComplexity(filesChanged);

            // 3. AI Semantic Analysis
            const aiResults = await this.analyzeWithAI(filesChanged);

            // 4. Calculate overall health score
            const healthScore = this.calculateOverallHealthScore({
                syntax: syntaxResults.summary.healthScore,
                complexity: complexityResults.healthScoreDelta,
                ai: aiResults.healthScore
            });

            // 5. Determine PR status
            const status = this.determinePRStatus({
                syntaxErrors: syntaxResults.summary.errors,
                complexityDelta: complexityResults.healthScoreDelta,
                aiVerdict: aiResults.verdict
            });

            // 6. Prepare analysis results
            const analysisResults = {
                lint: {
                    errors: syntaxResults.summary.errors,
                    warnings: syntaxResults.summary.warnings,
                    rawOutput: JSON.stringify(syntaxResults.files)
                },
                complexity: {
                    healthScoreDelta: complexityResults.healthScoreDelta,
                    fileChanges: complexityResults.fileChanges
                },
                aiScan: {
                    verdict: aiResults.verdict,
                    findings: aiResults.findings,
                    categories: aiResults.categories
                }
            };

            // 7. Update PR in database
            const updatedPR = await PullRequest.findOneAndUpdate(
                { prNumber: prData.prNumber, repoId: prData.repoId },
                {
                    $set: {
                        title: prData.title,
                        author: prData.author,
                        url: prData.url,
                        branch: prData.branch,
                        status,
                        healthScore: {
                            current: healthScore,
                            delta: complexityResults.healthScoreDelta
                        },
                        filesChanged: filesChanged.map(f => f.filename),
                        analysisResults,
                        blockReasons: this.getBlockReasons(analysisResults, status)
                    }
                },
                { new: true, upsert: true }
            );

            // 8. Emit WebSocket event
            if (io) {
                io.emit('pr:updated', updatedPR);
            }

            console.log(`✅ Analysis complete for PR #${prData.prNumber} - Status: ${status}`);

            return {
                success: true,
                pr: updatedPR,
                status,
                healthScore
            };

        } catch (error) {
            console.error('Error in PR analysis:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    /**
     * Analyze complexity for changed files
     */
    async analyzeComplexity(filesChanged) {
        const afterFiles = filesChanged.map(f => ({
            path: f.filename,
            content: f.patch || ''
        }));

        // For now, we don't have "before" files, so we'll just analyze current state
        const changes = [];
        let totalDelta = 0;

        for (const file of afterFiles) {
            if (this.complexityService.isAnalyzableFile(file.path)) {
                const analysis = this.complexityService.analyzeFile(file.path, file.content);
                const healthScore = this.complexityService.calculateHealthScore(
                    analysis.complexity,
                    analysis.maintainability
                );

                changes.push({
                    file: file.path,
                    beforeHealth: 0,
                    afterHealth: healthScore,
                    complexity: analysis.complexity,
                    delta: healthScore
                });

                totalDelta += healthScore;
            }
        }

        return {
            fileChanges: changes,
            healthScoreDelta: Math.round(totalDelta / Math.max(changes.length, 1))
        };
    }

    /**
     * Analyze with AI
     */
    async analyzeWithAI(filesChanged) {
        try {
            // Combine all patches into one diff
            const combinedDiff = filesChanged
                .map(f => `File: ${f.filename}\n${f.patch || ''}`)
                .join('\n\n');

            const aiResult = await analyzeCodeSemantic(combinedDiff, 'Code Quality Review');

            // Parse AI result
            const verdict = aiResult.status === 'pass' ? 'GOOD' : 'BAD';
            const findings = aiResult.securityRisks?.map(risk => ({
                message: risk,
                severity: 8,
                confidence: 'high',
                debtImpact: 'adds'
            })) || [];

            return {
                verdict,
                findings,
                healthScore: aiResult.status === 'pass' ? 85 : 45,
                categories: {
                    security: aiResult.securityRisks?.length > 0 ? 40 : 90,
                    correctness: 75,
                    maintainability: 70,
                    performance: 80,
                    testing: 60
                }
            };
        } catch (error) {
            console.error('AI analysis error:', error);
            return {
                verdict: 'PENDING',
                findings: [],
                healthScore: 70,
                categories: {}
            };
        }
    }

    /**
     * Calculate overall health score
     */
    calculateOverallHealthScore(scores) {
        const weights = {
            syntax: 0.3,
            complexity: 0.4,
            ai: 0.3
        };

        const weighted =
            (scores.syntax * weights.syntax) +
            (scores.complexity * weights.complexity) +
            (scores.ai * weights.ai);

        return Math.round(weighted);
    }

    /**
     * Determine PR status based on analysis results
     */
    determinePRStatus(results) {
        // BLOCK conditions
        if (results.syntaxErrors > 5) return 'BLOCK';
        if (results.complexityDelta < -20) return 'BLOCK';
        if (results.aiVerdict === 'BAD') return 'BLOCK';

        // WARN conditions
        if (results.syntaxErrors > 0) return 'WARN';
        if (results.complexityDelta < 0) return 'WARN';
        if (results.aiVerdict === 'RISKY') return 'WARN';

        // PASS
        return 'PASS';
    }

    /**
     * Get block reasons
     */
    getBlockReasons(analysisResults, status) {
        const reasons = [];

        if (status === 'BLOCK' || status === 'WARN') {
            if (analysisResults.lint.errors > 0) {
                reasons.push(`${analysisResults.lint.errors} syntax errors found`);
            }
            if (analysisResults.complexity.healthScoreDelta < 0) {
                reasons.push(`Complexity increased (delta: ${analysisResults.complexity.healthScoreDelta})`);
            }
            if (analysisResults.aiScan.verdict === 'BAD') {
                reasons.push('AI detected critical issues');
            }
        }

        return reasons;
    }

    /**
     * Analyze entire repository
     */
    async analyzeRepository(repoId, files, io = null) {
        try {
            console.log(`Starting full repository analysis for ${repoId}...`);

            const results = [];

            for (const file of files) {
                if (this.shouldAnalyzeFile(file.path)) {
                    // Syntax analysis
                    const syntax = await this.syntaxService.analyzeFile(file.path, file.content);

                    // Complexity analysis
                    const complexity = this.complexityService.analyzeFile(file.path, file.content);

                    // Churn analysis (if available)
                    const churnRate = this.churnService
                        ? await this.churnService.getFileChurnRate(file.path)
                        : 0;

                    // Calculate risk
                    const risk = complexity.complexity * churnRate;

                    // Save to database
                    await CodebaseFile.findOneAndUpdate(
                        { repoId, path: file.path },
                        {
                            $set: {
                                loc: complexity.loc,
                                complexity: complexity.complexity,
                                churnRate,
                                risk,
                                lastAnalyzed: new Date(),
                                dependencies: complexity.dependencies
                            },
                            $push: {
                                historicalMetrics: {
                                    date: new Date(),
                                    complexity: complexity.complexity,
                                    loc: complexity.loc,
                                    risk
                                }
                            }
                        },
                        { upsert: true, new: true }
                    );

                    results.push({
                        path: file.path,
                        complexity: complexity.complexity,
                        churnRate,
                        risk
                    });
                }
            }

            console.log(`✅ Repository analysis complete. Analyzed ${results.length} files.`);

            // Emit update
            if (io) {
                io.emit('metrics:updated', {
                    repoId,
                    filesAnalyzed: results.length,
                    timestamp: new Date()
                });
            }

            return {
                success: true,
                filesAnalyzed: results.length,
                results
            };

        } catch (error) {
            console.error('Repository analysis error:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    /**
     * Check if file should be analyzed
     */
    shouldAnalyzeFile(filename) {
        const analyzableExtensions = ['.js', '.jsx', '.ts', '.tsx', '.mjs', '.cjs'];
        const ext = filename.substring(filename.lastIndexOf('.'));

        // Exclude node_modules and other common directories
        if (filename.includes('node_modules') ||
            filename.includes('dist') ||
            filename.includes('build')) {
            return false;
        }

        return analyzableExtensions.includes(ext);
    }
}

module.exports = AnalysisOrchestrator;
