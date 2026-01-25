const escomplex = require('typhonjs-escomplex');
const parser = require('@babel/parser');

class ComplexityAnalysisService {
    /**
     * Analyze complexity of a single file
     */
    analyzeFile(filePath, fileContent) {
        try {
            // Parse the file
            const ast = parser.parse(fileContent, {
                sourceType: 'module',
                plugins: ['jsx', 'typescript']
            });

            // Analyze complexity
            const result = escomplex.analyzeModule(ast, {
                skipCalculation: false
            });

            return {
                complexity: result.aggregate.cyclomatic,
                maintainability: result.maintainability,
                loc: result.aggregate.sloc.physical,
                functions: result.methods.map(method => ({
                    name: method.name,
                    complexity: method.cyclomatic,
                    loc: method.sloc.physical,
                    params: method.params
                })),
                dependencies: result.dependencies.map(d => d.path)
            };
        } catch (error) {
            console.error('Complexity analysis error for', filePath, ':', error.message);
            return {
                complexity: 0,
                maintainability: 100,
                loc: 0,
                functions: [],
                dependencies: [],
                error: error.message
            };
        }
    }

    /**
     * Analyze multiple files
     */
    analyzeFiles(files) {
        const results = {};

        for (const file of files) {
            results[file.path] = this.analyzeFile(file.path, file.content);
        }

        return results;
    }

    /**
     * Calculate health score based on complexity
     * Returns a score from 0-100 (100 = simple, 0 = very complex)
     */
    calculateHealthScore(complexity, maintainability) {
        // Complexity thresholds
        const COMPLEXITY_THRESHOLD = 15;
        const MAINTAINABILITY_THRESHOLD = 65;

        let score = 100;

        // Deduct points for high complexity
        if (complexity > COMPLEXITY_THRESHOLD) {
            const excessComplexity = complexity - COMPLEXITY_THRESHOLD;
            score -= excessComplexity * 3; // 3 points per unit over threshold
        }

        // Deduct points for low maintainability
        if (maintainability < MAINTAINABILITY_THRESHOLD) {
            const deficit = MAINTAINABILITY_THRESHOLD - maintainability;
            score -= deficit;
        }

        return Math.max(0, Math.min(100, Math.round(score)));
    }

    /**
     * Analyze PR changes and calculate delta
     */
    analyzePRChanges(beforeFiles, afterFiles) {
        const changes = [];
        let totalDelta = 0;

        for (const file of afterFiles) {
            const beforeAnalysis = beforeFiles[file.path];
            const afterAnalysis = this.analyzeFile(file.path, file.content);

            if (beforeAnalysis) {
                const beforeHealth = this.calculateHealthScore(
                    beforeAnalysis.complexity,
                    beforeAnalysis.maintainability
                );
                const afterHealth = this.calculateHealthScore(
                    afterAnalysis.complexity,
                    afterAnalysis.maintainability
                );

                const delta = afterHealth - beforeHealth;
                totalDelta += delta;

                changes.push({
                    file: file.path,
                    beforeHealth,
                    afterHealth,
                    complexity: afterAnalysis.complexity,
                    delta
                });
            } else {
                // New file
                const afterHealth = this.calculateHealthScore(
                    afterAnalysis.complexity,
                    afterAnalysis.maintainability
                );

                changes.push({
                    file: file.path,
                    beforeHealth: 0,
                    afterHealth,
                    complexity: afterAnalysis.complexity,
                    delta: afterHealth
                });

                totalDelta += afterHealth;
            }
        }

        return {
            fileChanges: changes,
            healthScoreDelta: Math.round(totalDelta / afterFiles.length) || 0
        };
    }

    /**
     * Identify complex functions that need refactoring
     */
    identifyComplexFunctions(analysisResult, threshold = 10) {
        return analysisResult.functions
            .filter(fn => fn.complexity > threshold)
            .sort((a, b) => b.complexity - a.complexity);
    }

    /**
     * Check if file should be analyzed
     */
    isAnalyzableFile(filename) {
        const analyzableExtensions = ['.js', '.jsx', '.ts', '.tsx', '.mjs', '.cjs'];
        const ext = filename.substring(filename.lastIndexOf('.'));
        return analyzableExtensions.includes(ext);
    }
}

module.exports = ComplexityAnalysisService;
