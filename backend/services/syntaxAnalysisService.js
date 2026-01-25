const { ESLint } = require('eslint');
const path = require('path');

class SyntaxAnalysisService {
    constructor() {
        this.eslint = new ESLint({
            useEslintrc: false,
            overrideConfig: {
                env: {
                    browser: true,
                    es2021: true,
                    node: true
                },
                extends: ['eslint:recommended'],
                parserOptions: {
                    ecmaVersion: 'latest',
                    sourceType: 'module',
                    ecmaFeatures: {
                        jsx: true
                    }
                },
                rules: {
                    'no-unused-vars': 'warn',
                    'no-console': 'off',
                    'no-undef': 'error'
                }
            }
        });
    }

    /**
     * Analyze a single file
     */
    async analyzeFile(filePath, fileContent) {
        try {
            const results = await this.eslint.lintText(fileContent, {
                filePath
            });

            const result = results[0];
            const errors = result.messages.filter(m => m.severity === 2);
            const warnings = result.messages.filter(m => m.severity === 1);

            return {
                errors: errors.length,
                warnings: warnings.length,
                messages: result.messages.map(m => ({
                    line: m.line,
                    column: m.column,
                    message: m.message,
                    ruleId: m.ruleId,
                    severity: m.severity === 2 ? 'error' : 'warning'
                })),
                rawOutput: JSON.stringify(result.messages, null, 2)
            };
        } catch (error) {
            console.error('Syntax analysis error:', error);
            return {
                errors: 0,
                warnings: 0,
                messages: [],
                rawOutput: `Analysis failed: ${error.message}`
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
