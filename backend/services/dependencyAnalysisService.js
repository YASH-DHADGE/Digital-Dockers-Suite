const parser = require('@babel/parser');
const traverse = require('@babel/traverse').default;

class DependencyAnalysisService {
    /**
     * Analyze dependencies in a file
     */
    analyzeFile(filePath, fileContent) {
        try {
            const ast = parser.parse(fileContent, {
                sourceType: 'module',
                plugins: ['jsx', 'typescript', 'decorators-legacy']
            });

            const dependencies = {
                imports: [],
                exports: [],
                requires: []
            };

            traverse(ast, {
                ImportDeclaration(path) {
                    dependencies.imports.push({
                        source: path.node.source.value,
                        specifiers: path.node.specifiers.map(s => s.local.name)
                    });
                },
                ExportNamedDeclaration(path) {
                    if (path.node.source) {
                        dependencies.exports.push({
                            source: path.node.source.value,
                            type: 'named'
                        });
                    }
                },
                ExportDefaultDeclaration(path) {
                    dependencies.exports.push({
                        type: 'default'
                    });
                },
                CallExpression(path) {
                    if (path.node.callee.name === 'require') {
                        const arg = path.node.arguments[0];
                        if (arg && arg.type === 'StringLiteral') {
                            dependencies.requires.push({
                                source: arg.value
                            });
                        }
                    }
                }
            });

            return {
                imports: dependencies.imports,
                exports: dependencies.exports,
                requires: dependencies.requires,
                allDependencies: this.getAllDependencies(dependencies)
            };
        } catch (error) {
            console.error('Dependency analysis error for', filePath, ':', error.message);
            return {
                imports: [],
                exports: [],
                requires: [],
                allDependencies: [],
                error: error.message
            };
        }
    }

    /**
     * Get all unique dependencies
     */
    getAllDependencies(dependencies) {
        const all = new Set();

        dependencies.imports.forEach(imp => all.add(imp.source));
        dependencies.exports.forEach(exp => exp.source && all.add(exp.source));
        dependencies.requires.forEach(req => all.add(req.source));

        return Array.from(all);
    }

    /**
     * Build dependency graph for multiple files
     */
    buildDependencyGraph(files) {
        const graph = {};

        for (const file of files) {
            const analysis = this.analyzeFile(file.path, file.content);
            graph[file.path] = {
                dependencies: analysis.allDependencies,
                imports: analysis.imports,
                exports: analysis.exports
            };
        }

        return graph;
    }

    /**
     * Detect circular dependencies
     */
    detectCircularDependencies(graph) {
        const visited = new Set();
        const recursionStack = new Set();
        const cycles = [];

        const dfs = (node, path = []) => {
            if (recursionStack.has(node)) {
                // Found a cycle
                const cycleStart = path.indexOf(node);
                cycles.push(path.slice(cycleStart).concat(node));
                return;
            }

            if (visited.has(node)) {
                return;
            }

            visited.add(node);
            recursionStack.add(node);
            path.push(node);

            const deps = graph[node]?.dependencies || [];
            for (const dep of deps) {
                // Only check internal dependencies (not node_modules)
                if (graph[dep]) {
                    dfs(dep, [...path]);
                }
            }

            recursionStack.delete(node);
        };

        for (const node in graph) {
            dfs(node);
        }

        return cycles;
    }

    /**
     * Calculate coupling metrics
     */
    calculateCoupling(graph) {
        const metrics = {};

        for (const [file, data] of Object.entries(graph)) {
            const afferentCoupling = this.getAfferentCoupling(file, graph);
            const efferentCoupling = data.dependencies.length;
            const instability = efferentCoupling / (afferentCoupling + efferentCoupling) || 0;

            metrics[file] = {
                afferentCoupling,  // How many files depend on this file
                efferentCoupling,  // How many files this file depends on
                instability,       // 0 = stable, 1 = unstable
                totalCoupling: afferentCoupling + efferentCoupling
            };
        }

        return metrics;
    }

    /**
     * Get afferent coupling (how many files depend on this file)
     */
    getAfferentCoupling(targetFile, graph) {
        let count = 0;

        for (const [file, data] of Object.entries(graph)) {
            if (file !== targetFile && data.dependencies.includes(targetFile)) {
                count++;
            }
        }

        return count;
    }

    /**
     * Identify highly coupled files
     */
    identifyHighlyCoupledFiles(couplingMetrics, threshold = 10) {
        return Object.entries(couplingMetrics)
            .filter(([_, metrics]) => metrics.totalCoupling > threshold)
            .sort((a, b) => b[1].totalCoupling - a[1].totalCoupling)
            .map(([file, metrics]) => ({ file, ...metrics }));
    }

    /**
     * Get dependency tree for a file
     */
    getDependencyTree(file, graph, maxDepth = 3, currentDepth = 0) {
        if (currentDepth >= maxDepth || !graph[file]) {
            return null;
        }

        const deps = graph[file].dependencies || [];
        const tree = {
            file,
            dependencies: []
        };

        for (const dep of deps) {
            if (graph[dep]) {
                const subtree = this.getDependencyTree(dep, graph, maxDepth, currentDepth + 1);
                if (subtree) {
                    tree.dependencies.push(subtree);
                }
            }
        }

        return tree;
    }
}

module.exports = DependencyAnalysisService;
