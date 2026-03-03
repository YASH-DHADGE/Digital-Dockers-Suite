const { ESLint } = require('eslint');

const lintCode = async (code, filePath = 'file.js') => {
    try {
        const eslint = new ESLint();
        const results = await eslint.lintText(code, { filePath });
        const formatter = await eslint.loadFormatter('stylish');
        const resultText = formatter.format(results);

        const errors = results[0].messages.map(msg => ({
            line: msg.line,
            message: msg.message,
            ruleId: msg.ruleId,
            severity: msg.severity === 1 ? 'warning' : 'error'
        }));

        return {
            status: errors.some(e => e.severity === 'error') ? 'fail' : 'pass',
            errors: errors,
            rawOutput: resultText
        };
    } catch (error) {
        console.error('Linter Error:', error);
        return { status: 'fail', errors: [{ message: 'Linter failed to run', error: error.message }] };
    }
};

module.exports = {
    lintCode
};
