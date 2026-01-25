const { ESLint } = require('eslint');

const analyze = async (files) => {
    // files array of { path, content } or just paths if checking on disk.
    // Assuming passed content for 'virtual' linting or paths relative to repo root
    try {
        const eslint = new ESLint();
        // Just mocking the return structure for the queue to consume
        // In real impl, we'd write temp files or use eslint.lintText

        let errorCount = 0;
        let warningCount = 0;
        let details = [];

        for (const file of files) {
            if (!file.content) continue;
            const results = await eslint.lintText(file.content, { filePath: file.path });
            results.forEach(result => {
                errorCount += result.errorCount;
                warningCount += result.warningCount;
                details.push(...result.messages);
            });
        }

        return {
            errorCount,
            warningCount,
            output: JSON.stringify(details)
        };
    } catch (error) {
        console.error('Static Analysis Failed', error);
        return { errorCount: 0, warningCount: 0, output: 'Analysis Failed' };
    }
};

module.exports = { analyze };
