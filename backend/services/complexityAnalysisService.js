const escomplex = require('typhonjs-escomplex');
const parser = require('@babel/parser');

class ComplexityAnalysisService {
    /**
     * Analyze complexity of a single file with polyglot support
     */
    analyzeFile(filePath, fileContent) {
        try {
            const ext = filePath.substring(filePath.lastIndexOf('.')).toLowerCase();
            const lines = fileContent.split('\n');
            const loc = lines.length;

            // JavaScript/TypeScript family - use typhonjs-escomplex
            const jsExtensions = ['.js', '.jsx', '.ts', '.tsx', '.mjs', '.cjs'];
            if (jsExtensions.includes(ext)) {
                return this.analyzeJavaScript(filePath, fileContent);
            }

            // Python - indentation-based complexity analysis
            if (ext === '.py') {
                return this.analyzePython(fileContent, loc);
            }

            // Java/Kotlin - class/method detection
            if (ext === '.java' || ext === '.kt') {
                return this.analyzeJavaKotlin(fileContent, loc, ext);
            }

            // Go - func complexity
            if (ext === '.go') {
                return this.analyzeGo(fileContent, loc);
            }

            // Ruby - method counting
            if (ext === '.rb') {
                return this.analyzeRuby(fileContent, loc);
            }

            // PHP - class/function detection
            if (ext === '.php') {
                return this.analyzePHP(fileContent, loc);
            }

            // C/C++/C# - function detection
            if (['.c', '.cpp', '.h', '.cs'].includes(ext)) {
                return this.analyzeCFamily(fileContent, loc);
            }

            // Rust - fn detection
            if (ext === '.rs') {
                return this.analyzeRust(fileContent, loc);
            }

            // Swift - func detection
            if (ext === '.swift') {
                return this.analyzeSwift(fileContent, loc);
            }

            // Default fallback for other files
            return this.analyzeGeneric(fileContent, loc);

        } catch (error) {
            console.error('Complexity analysis error for', filePath, ':', error.message);
            return {
                complexity: 1,
                maintainability: 70,
                loc: fileContent.split('\n').length,
                functions: [],
                dependencies: [],
                error: error.message
            };
        }
    }

    /**
     * JavaScript/TypeScript analysis using typhonjs-escomplex
     */
    analyzeJavaScript(filePath, fileContent) {
        try {
            const ast = parser.parse(fileContent, {
                sourceType: 'module',
                plugins: ['jsx', 'typescript', 'decorators-legacy', 'classProperties']
            });

            const result = escomplex.analyzeModule(ast, {
                skipCalculation: false
            });

            return {
                complexity: result.aggregate.cyclomatic,
                maintainability: result.maintainability,
                loc: result.aggregate.sloc.physical,
                halstead: result.aggregate.halstead,
                functions: result.methods.map(method => ({
                    name: method.name,
                    complexity: method.cyclomatic,
                    loc: method.sloc.physical,
                    params: method.params
                })),
                dependencies: result.dependencies.map(d => d.path)
            };
        } catch (parseError) {
            // Fallback if parsing fails (e.g., advanced syntax)
            const lines = fileContent.split('\n');
            const loc = lines.length;
            return this.analyzeGeneric(fileContent, loc);
        }
    }

    /**
     * Python analysis - indentation-based complexity
     */
    analyzePython(fileContent, loc) {
        const lines = fileContent.split('\n');
        const functions = [];
        let totalComplexity = 1;
        const dependencies = [];

        // Control flow keywords that increase complexity
        const controlFlowPatterns = /\b(if|elif|for|while|except|with|and|or)\b/g;
        // Function/class definitions
        const defPattern = /^(\s*)(def|class|async def)\s+(\w+)/;
        // Import statements
        const importPattern = /^(?:from\s+(\S+)\s+)?import\s+(.+)/;

        let currentFunction = null;
        let currentFunctionComplexity = 1;
        let currentFunctionLoc = 0;
        let currentIndent = 0;

        for (const line of lines) {
            const trimmed = line.trim();

            // Skip comments and empty lines
            if (!trimmed || trimmed.startsWith('#')) continue;

            // Check for imports
            const importMatch = line.match(importPattern);
            if (importMatch) {
                const module = importMatch[1] || importMatch[2].split(',')[0].trim();
                if (module && !dependencies.includes(module)) {
                    dependencies.push(module);
                }
            }

            // Check for function/class definition
            const defMatch = line.match(defPattern);
            if (defMatch) {
                // Save previous function if exists
                if (currentFunction && defMatch[2] !== 'class') {
                    functions.push({
                        name: currentFunction,
                        complexity: currentFunctionComplexity,
                        loc: currentFunctionLoc,
                        params: 0
                    });
                }
                if (defMatch[2] !== 'class') {
                    currentFunction = defMatch[3];
                    currentFunctionComplexity = 1;
                    currentFunctionLoc = 1;
                    currentIndent = defMatch[1].length;
                }
            } else if (currentFunction) {
                currentFunctionLoc++;
            }

            // Count control flow complexity
            const matches = trimmed.match(controlFlowPatterns);
            if (matches) {
                const increment = matches.length;
                totalComplexity += increment;
                if (currentFunction) {
                    currentFunctionComplexity += increment;
                }
            }
        }

        // Don't forget last function
        if (currentFunction) {
            functions.push({
                name: currentFunction,
                complexity: currentFunctionComplexity,
                loc: currentFunctionLoc,
                params: 0
            });
        }

        const maintainability = this.calculateMaintainability(totalComplexity, loc, functions.length);

        return {
            complexity: totalComplexity,
            maintainability,
            loc,
            functions,
            dependencies
        };
    }

    /**
     * Java/Kotlin analysis - class/method detection
     */
    analyzeJavaKotlin(fileContent, loc, ext) {
        const lines = fileContent.split('\n');
        const functions = [];
        let totalComplexity = 1;
        const dependencies = [];

        // Control flow patterns
        const controlFlowPatterns = /\b(if|else if|for|while|switch|case|catch|&&|\|\||\?)\b/g;
        // Method definition patterns
        const methodPattern = ext === '.kt'
            ? /^\s*(fun|override fun|private fun|public fun|internal fun|protected fun)\s+(\w+)/
            : /^\s*(public|private|protected)?\s*(static)?\s*\w+\s+(\w+)\s*\(/;
        // Import patterns
        const importPattern = /^import\s+([\w.]+)/;

        let currentMethod = null;
        let currentMethodComplexity = 1;
        let currentMethodLoc = 0;
        let braceCount = 0;

        for (const line of lines) {
            const trimmed = line.trim();

            if (!trimmed || trimmed.startsWith('//') || trimmed.startsWith('/*') || trimmed.startsWith('*')) continue;

            // Check for imports
            const importMatch = line.match(importPattern);
            if (importMatch) {
                dependencies.push(importMatch[1]);
            }

            // Check for method definition
            const methodMatch = line.match(methodPattern);
            if (methodMatch && !trimmed.includes(';')) {
                if (currentMethod) {
                    functions.push({
                        name: currentMethod,
                        complexity: currentMethodComplexity,
                        loc: currentMethodLoc,
                        params: 0
                    });
                }
                currentMethod = ext === '.kt' ? methodMatch[2] : methodMatch[3];
                currentMethodComplexity = 1;
                currentMethodLoc = 1;
            } else if (currentMethod) {
                currentMethodLoc++;
            }

            // Count braces to track method scope
            braceCount += (line.match(/{/g) || []).length;
            braceCount -= (line.match(/}/g) || []).length;

            // Count control flow
            const matches = trimmed.match(controlFlowPatterns);
            if (matches) {
                const increment = matches.length;
                totalComplexity += increment;
                if (currentMethod) {
                    currentMethodComplexity += increment;
                }
            }
        }

        if (currentMethod) {
            functions.push({
                name: currentMethod,
                complexity: currentMethodComplexity,
                loc: currentMethodLoc,
                params: 0
            });
        }

        const maintainability = this.calculateMaintainability(totalComplexity, loc, functions.length);

        return {
            complexity: totalComplexity,
            maintainability,
            loc,
            functions,
            dependencies
        };
    }

    /**
     * Go analysis - func complexity
     */
    analyzeGo(fileContent, loc) {
        const lines = fileContent.split('\n');
        const functions = [];
        let totalComplexity = 1;
        const dependencies = [];

        const controlFlowPatterns = /\b(if|else|for|switch|case|select|&&|\|\|)\b/g;
        const funcPattern = /^func\s+(\([^)]+\)\s+)?(\w+)/;
        const importPattern = /^\s*"([^"]+)"/;

        let currentFunc = null;
        let currentFuncComplexity = 1;
        let currentFuncLoc = 0;
        let inImport = false;

        for (const line of lines) {
            const trimmed = line.trim();

            if (!trimmed || trimmed.startsWith('//')) continue;

            // Track import block
            if (trimmed === 'import (') {
                inImport = true;
                continue;
            }
            if (inImport && trimmed === ')') {
                inImport = false;
                continue;
            }
            if (inImport) {
                const importMatch = trimmed.match(importPattern);
                if (importMatch) {
                    dependencies.push(importMatch[1]);
                }
                continue;
            }

            // Check for func definition
            const funcMatch = line.match(funcPattern);
            if (funcMatch) {
                if (currentFunc) {
                    functions.push({
                        name: currentFunc,
                        complexity: currentFuncComplexity,
                        loc: currentFuncLoc,
                        params: 0
                    });
                }
                currentFunc = funcMatch[2];
                currentFuncComplexity = 1;
                currentFuncLoc = 1;
            } else if (currentFunc) {
                currentFuncLoc++;
            }

            const matches = trimmed.match(controlFlowPatterns);
            if (matches) {
                const increment = matches.length;
                totalComplexity += increment;
                if (currentFunc) {
                    currentFuncComplexity += increment;
                }
            }
        }

        if (currentFunc) {
            functions.push({
                name: currentFunc,
                complexity: currentFuncComplexity,
                loc: currentFuncLoc,
                params: 0
            });
        }

        const maintainability = this.calculateMaintainability(totalComplexity, loc, functions.length);

        return {
            complexity: totalComplexity,
            maintainability,
            loc,
            functions,
            dependencies
        };
    }

    /**
     * Ruby analysis - method counting
     */
    analyzeRuby(fileContent, loc) {
        const lines = fileContent.split('\n');
        const functions = [];
        let totalComplexity = 1;
        const dependencies = [];

        const controlFlowPatterns = /\b(if|elsif|unless|case|when|while|until|for|rescue|&&|\|\|)\b/g;
        const methodPattern = /^\s*def\s+(\w+)/;
        const requirePattern = /^require\s+['"]([^'"]+)['"]/;

        let currentMethod = null;
        let currentMethodComplexity = 1;
        let currentMethodLoc = 0;

        for (const line of lines) {
            const trimmed = line.trim();

            if (!trimmed || trimmed.startsWith('#')) continue;

            // Check for requires
            const requireMatch = line.match(requirePattern);
            if (requireMatch) {
                dependencies.push(requireMatch[1]);
            }

            // Check for method definition
            const methodMatch = line.match(methodPattern);
            if (methodMatch) {
                if (currentMethod) {
                    functions.push({
                        name: currentMethod,
                        complexity: currentMethodComplexity,
                        loc: currentMethodLoc,
                        params: 0
                    });
                }
                currentMethod = methodMatch[1];
                currentMethodComplexity = 1;
                currentMethodLoc = 1;
            } else if (currentMethod) {
                currentMethodLoc++;
                if (trimmed === 'end') {
                    functions.push({
                        name: currentMethod,
                        complexity: currentMethodComplexity,
                        loc: currentMethodLoc,
                        params: 0
                    });
                    currentMethod = null;
                }
            }

            const matches = trimmed.match(controlFlowPatterns);
            if (matches) {
                const increment = matches.length;
                totalComplexity += increment;
                if (currentMethod) {
                    currentMethodComplexity += increment;
                }
            }
        }

        const maintainability = this.calculateMaintainability(totalComplexity, loc, functions.length);

        return {
            complexity: totalComplexity,
            maintainability,
            loc,
            functions,
            dependencies
        };
    }

    /**
     * PHP analysis - class/function detection
     */
    analyzePHP(fileContent, loc) {
        const lines = fileContent.split('\n');
        const functions = [];
        let totalComplexity = 1;
        const dependencies = [];

        const controlFlowPatterns = /\b(if|elseif|else|for|foreach|while|switch|case|catch|&&|\|\||\?:)\b/g;
        const funcPattern = /^\s*(public|private|protected)?\s*(static)?\s*function\s+(\w+)/;
        const usePattern = /^use\s+([\w\\]+)/;

        let currentFunc = null;
        let currentFuncComplexity = 1;
        let currentFuncLoc = 0;

        for (const line of lines) {
            const trimmed = line.trim();

            if (!trimmed || trimmed.startsWith('//') || trimmed.startsWith('/*') || trimmed.startsWith('*')) continue;

            // Check for use statements
            const useMatch = line.match(usePattern);
            if (useMatch) {
                dependencies.push(useMatch[1]);
            }

            // Check for function definition
            const funcMatch = line.match(funcPattern);
            if (funcMatch) {
                if (currentFunc) {
                    functions.push({
                        name: currentFunc,
                        complexity: currentFuncComplexity,
                        loc: currentFuncLoc,
                        params: 0
                    });
                }
                currentFunc = funcMatch[3];
                currentFuncComplexity = 1;
                currentFuncLoc = 1;
            } else if (currentFunc) {
                currentFuncLoc++;
            }

            const matches = trimmed.match(controlFlowPatterns);
            if (matches) {
                const increment = matches.length;
                totalComplexity += increment;
                if (currentFunc) {
                    currentFuncComplexity += increment;
                }
            }
        }

        if (currentFunc) {
            functions.push({
                name: currentFunc,
                complexity: currentFuncComplexity,
                loc: currentFuncLoc,
                params: 0
            });
        }

        const maintainability = this.calculateMaintainability(totalComplexity, loc, functions.length);

        return {
            complexity: totalComplexity,
            maintainability,
            loc,
            functions,
            dependencies
        };
    }

    /**
     * C/C++/C# analysis
     */
    analyzeCFamily(fileContent, loc) {
        const lines = fileContent.split('\n');
        const functions = [];
        let totalComplexity = 1;
        const dependencies = [];

        const controlFlowPatterns = /\b(if|else if|for|while|switch|case|catch|&&|\|\||\?)\b/g;
        const funcPattern = /^\s*(?:public|private|protected|static|virtual|override|async)?\s*\w+\s+(\w+)\s*\([^)]*\)\s*(?:const)?\s*\{?$/;
        const includePattern = /^#include\s*[<"]([^>"]+)[>"]/;
        const usingPattern = /^using\s+([\w.]+)/;

        let currentFunc = null;
        let currentFuncComplexity = 1;
        let currentFuncLoc = 0;

        for (const line of lines) {
            const trimmed = line.trim();

            if (!trimmed || trimmed.startsWith('//') || trimmed.startsWith('/*') || trimmed.startsWith('*')) continue;

            // Check for includes/using
            const includeMatch = line.match(includePattern);
            if (includeMatch) {
                dependencies.push(includeMatch[1]);
            }
            const usingMatch = line.match(usingPattern);
            if (usingMatch) {
                dependencies.push(usingMatch[1]);
            }

            // Check for function definition
            const funcMatch = line.match(funcPattern);
            if (funcMatch && !['if', 'while', 'for', 'switch'].includes(funcMatch[1])) {
                if (currentFunc) {
                    functions.push({
                        name: currentFunc,
                        complexity: currentFuncComplexity,
                        loc: currentFuncLoc,
                        params: 0
                    });
                }
                currentFunc = funcMatch[1];
                currentFuncComplexity = 1;
                currentFuncLoc = 1;
            } else if (currentFunc) {
                currentFuncLoc++;
            }

            const matches = trimmed.match(controlFlowPatterns);
            if (matches) {
                const increment = matches.length;
                totalComplexity += increment;
                if (currentFunc) {
                    currentFuncComplexity += increment;
                }
            }
        }

        if (currentFunc) {
            functions.push({
                name: currentFunc,
                complexity: currentFuncComplexity,
                loc: currentFuncLoc,
                params: 0
            });
        }

        const maintainability = this.calculateMaintainability(totalComplexity, loc, functions.length);

        return {
            complexity: totalComplexity,
            maintainability,
            loc,
            functions,
            dependencies
        };
    }

    /**
     * Rust analysis
     */
    analyzeRust(fileContent, loc) {
        const lines = fileContent.split('\n');
        const functions = [];
        let totalComplexity = 1;
        const dependencies = [];

        const controlFlowPatterns = /\b(if|else|match|loop|while|for|&&|\|\||\?)\b/g;
        const fnPattern = /^\s*(pub\s+)?(async\s+)?fn\s+(\w+)/;
        const usePattern = /^use\s+([\w:]+)/;

        let currentFn = null;
        let currentFnComplexity = 1;
        let currentFnLoc = 0;

        for (const line of lines) {
            const trimmed = line.trim();

            if (!trimmed || trimmed.startsWith('//')) continue;

            // Check for use statements
            const useMatch = line.match(usePattern);
            if (useMatch) {
                dependencies.push(useMatch[1]);
            }

            // Check for fn definition
            const fnMatch = line.match(fnPattern);
            if (fnMatch) {
                if (currentFn) {
                    functions.push({
                        name: currentFn,
                        complexity: currentFnComplexity,
                        loc: currentFnLoc,
                        params: 0
                    });
                }
                currentFn = fnMatch[3];
                currentFnComplexity = 1;
                currentFnLoc = 1;
            } else if (currentFn) {
                currentFnLoc++;
            }

            const matches = trimmed.match(controlFlowPatterns);
            if (matches) {
                const increment = matches.length;
                totalComplexity += increment;
                if (currentFn) {
                    currentFnComplexity += increment;
                }
            }
        }

        if (currentFn) {
            functions.push({
                name: currentFn,
                complexity: currentFnComplexity,
                loc: currentFnLoc,
                params: 0
            });
        }

        const maintainability = this.calculateMaintainability(totalComplexity, loc, functions.length);

        return {
            complexity: totalComplexity,
            maintainability,
            loc,
            functions,
            dependencies
        };
    }

    /**
     * Swift analysis
     */
    analyzeSwift(fileContent, loc) {
        const lines = fileContent.split('\n');
        const functions = [];
        let totalComplexity = 1;
        const dependencies = [];

        const controlFlowPatterns = /\b(if|else|guard|switch|case|for|while|repeat|catch|&&|\|\||\?)\b/g;
        const funcPattern = /^\s*(public|private|internal|fileprivate|open)?\s*(static|class)?\s*func\s+(\w+)/;
        const importPattern = /^import\s+(\w+)/;

        let currentFunc = null;
        let currentFuncComplexity = 1;
        let currentFuncLoc = 0;

        for (const line of lines) {
            const trimmed = line.trim();

            if (!trimmed || trimmed.startsWith('//')) continue;

            // Check for imports
            const importMatch = line.match(importPattern);
            if (importMatch) {
                dependencies.push(importMatch[1]);
            }

            // Check for func definition
            const funcMatch = line.match(funcPattern);
            if (funcMatch) {
                if (currentFunc) {
                    functions.push({
                        name: currentFunc,
                        complexity: currentFuncComplexity,
                        loc: currentFuncLoc,
                        params: 0
                    });
                }
                currentFunc = funcMatch[3];
                currentFuncComplexity = 1;
                currentFuncLoc = 1;
            } else if (currentFunc) {
                currentFuncLoc++;
            }

            const matches = trimmed.match(controlFlowPatterns);
            if (matches) {
                const increment = matches.length;
                totalComplexity += increment;
                if (currentFunc) {
                    currentFuncComplexity += increment;
                }
            }
        }

        if (currentFunc) {
            functions.push({
                name: currentFunc,
                complexity: currentFuncComplexity,
                loc: currentFuncLoc,
                params: 0
            });
        }

        const maintainability = this.calculateMaintainability(totalComplexity, loc, functions.length);

        return {
            complexity: totalComplexity,
            maintainability,
            loc,
            functions,
            dependencies
        };
    }

    /**
     * Generic analysis fallback for other languages
     */
    analyzeGeneric(fileContent, loc) {
        const lines = fileContent.split('\n');
        let totalComplexity = 1;

        // Universal control flow patterns
        const controlFlowPatterns = /\b(if|else|for|while|switch|case|catch|try|&&|\|\|)\b/g;

        for (const line of lines) {
            const matches = line.match(controlFlowPatterns);
            if (matches) {
                totalComplexity += matches.length;
            }
        }

        // Estimate complexity based on LOC as fallback
        const locBasedComplexity = Math.max(1, Math.floor(loc / 20));
        totalComplexity = Math.max(totalComplexity, locBasedComplexity);

        const maintainability = this.calculateMaintainability(totalComplexity, loc, 0);

        return {
            complexity: totalComplexity,
            maintainability,
            loc,
            functions: [],
            dependencies: []
        };
    }

    /**
     * Calculate maintainability index (0-100)
     */
    calculateMaintainability(complexity, loc, numFunctions) {
        // Simplified maintainability formula
        // Based on Microsoft's Maintainability Index formula (simplified)
        const halsteadVolume = loc * Math.log2(Math.max(1, complexity)); // Approximation
        const cyclomatic = complexity;
        const linesOfCode = loc;

        // MI = 171 - 5.2 * ln(V) - 0.23 * CC - 16.2 * ln(LOC)
        let mi = 171 - 5.2 * Math.log(Math.max(1, halsteadVolume))
            - 0.23 * cyclomatic
            - 16.2 * Math.log(Math.max(1, linesOfCode));

        // Normalize to 0-100
        mi = Math.max(0, Math.min(100, mi));

        return Math.round(mi);
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
        // Broaden support to match Orchestrator
        const analyzableExtensions = [
            '.js', '.jsx', '.ts', '.tsx', '.mjs', '.cjs',
            '.py', '.java', '.rb', '.go', '.rs', '.php',
            '.c', '.cpp', '.h', '.cs', '.swift', '.kt',
            '.html', '.css', '.scss', '.less', '.json', '.xml', '.yaml', '.yml'
        ];
        const ext = filename.substring(filename.lastIndexOf('.')).toLowerCase();
        return analyzableExtensions.includes(ext);
    }
}

module.exports = ComplexityAnalysisService;
