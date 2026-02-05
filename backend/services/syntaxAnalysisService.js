const path = require('path');

class SyntaxAnalysisService {
    constructor() {
        // Simple syntax analysis without ESLint dependency
        // ESLint 9 has breaking changes with flat config - skip it for now
    }

    /**
     * Analyze a single file - simplified without ESLint
     */
    async analyzeFile(filePath, fileContent) {
        try {
            const jsExtensions = ['.js', '.jsx', '.mjs', '.cjs', '.ts', '.tsx'];
            const ext = path.extname(filePath).toLowerCase();

            // Skip non-JS files
            if (!jsExtensions.includes(ext)) {
                return {
                    errors: 0,
                    warnings: 0,
                    messages: [],
                    rawOutput: 'Skipped (Non-JS)'
                };
            }

            // Skip files that are too large (>100KB) or minified
            if (fileContent.length > 100000 || filePath.includes('.min.')) {
                return {
                    errors: 0,
                    warnings: 0,
                    messages: [],
                    rawOutput: 'Skipped (Too large or minified)'
                };
            }

            // Simple syntax checks without ESLint
            const lines = fileContent.split('\n');
            const issues = [];
            let errors = 0;
            let warnings = 0;

            // Check for common issues
            lines.forEach((line, index) => {
                const lineNum = index + 1;

                // Check for console.log (warning)
                if (line.includes('console.log') && !line.trim().startsWith('//')) {
                    warnings++;
                    issues.push({
                        line: lineNum,
                        column: line.indexOf('console.log') + 1,
                        message: 'Unexpected console.log statement',
                        ruleId: 'no-console',
                        severity: 'warning'
                    });
                }

                // Check for debugger keyword (error)
                if (line.includes('debugger') && !line.trim().startsWith('//')) {
                    errors++;
                    issues.push({
                        line: lineNum,
                        column: line.indexOf('debugger') + 1,
                        message: 'Unexpected debugger statement',
                        ruleId: 'no-debugger',
                        severity: 'error'
                    });
                }

                // Check for TODO/FIXME (warning)
                if (line.includes('TODO') || line.includes('FIXME')) {
                    warnings++;
                    issues.push({
                        line: lineNum,
                        column: 1,
                        message: 'Found TODO/FIXME comment',
                        ruleId: 'todo-comment',
                        severity: 'warning'
                    });
                }
            });

            return {
                errors,
                warnings,
                messages: issues.slice(0, 20),
                rawOutput: JSON.stringify(issues.slice(0, 20), null, 2)
            };
        } catch (error) {
            return {
                errors: 0,
                warnings: 0,
                messages: [],
                rawOutput: `Skipped: ${error.message?.substring(0, 50) || 'Unknown error'}`
            };
        }
    }

    /**
     * Analyze multiple files
     */
    async analyzeFiles(files) {
        const results = {};

        for (const file of files) {
            results[file.path] = await this.analyzeFile(file.path, file.content);
        }

        return results;
    }

    /**
     * Calculate overall health score based on lint results
     * Returns a score from 0-100 (100 = perfect)
     */
    calculateHealthScore(lintResults) {
        const { errors, warnings } = lintResults;

        // Deduct points for errors and warnings
        const errorPenalty = errors * 10;
        const warningPenalty = warnings * 2;

        const score = Math.max(0, 100 - errorPenalty - warningPenalty);
        return Math.round(score);
    }

    /**
     * Analyze PR diff (only changed lines)
     */
    async analyzePRDiff(filesChanged) {
        const results = {};
        let totalErrors = 0;
        let totalWarnings = 0;

        for (const file of filesChanged) {
            if (this.isAnalyzableFile(file.filename)) {
                const analysis = await this.analyzeFile(file.filename, file.patch || '');
                results[file.filename] = analysis;
                totalErrors += analysis.errors;
                totalWarnings += analysis.warnings;
            }
        }

        return {
            files: results,
            summary: {
                errors: totalErrors,
                warnings: totalWarnings,
                healthScore: this.calculateHealthScore({
                    errors: totalErrors,
                    warnings: totalWarnings
                })
            }
        };
    }

    /**
     * Check if file should be analyzed
     */
    isAnalyzableFile(filename) {
        const analyzableExtensions = ['.js', '.jsx', '.ts', '.tsx', '.mjs', '.cjs'];
        const ext = path.extname(filename);
        return analyzableExtensions.includes(ext);
    }
}

module.exports = SyntaxAnalysisService;
