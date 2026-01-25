const escomplex = require('typhonjs-escomplex');
// const parser = require('@babel/parser'); // If we needed custom AST walking, but typhonjs uses babel under the hood or similar

const analyze = async (files) => {
    let totalDelta = 0;
    const fileChanges = [];

    for (const file of files) {
        if (!file.content) continue;

        try {
            // Analyze New Content
            const report = escomplex.analyzeModule(file.content);
            const maintainability = report.maintainability; // 0-171 typically
            const healthScore = Math.min(Math.max(maintainability, 0), 100);

            // Ideally we fetch 'previous' content from Git to compare
            // For MVP this turn, we assume a base baseline or 0 delta if new file
            const previousHealth = file.previousContent ?
                Math.min(Math.max(escomplex.analyzeModule(file.previousContent).maintainability, 0), 100)
                : healthScore;

            const delta = healthScore - previousHealth;

            fileChanges.push({
                file: file.path,
                beforeHealth: previousHealth,
                afterHealth: healthScore,
                complexity: report.aggregate.cyclomatic
            });

            totalDelta += delta;

        } catch (e) {
            console.warn(`Complexity analysis skipped for ${file.path}`, e.message);
        }
    }

    return {
        delta: totalDelta,
        fileChanges
    };
};

module.exports = { analyze };
