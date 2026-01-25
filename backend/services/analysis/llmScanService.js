const { GoogleGenerativeAI } = require('@google/generative-ai');
require('dotenv').config();

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

const scan = async (files) => {
    if (!files || files.length === 0) return { verdict: 'GOOD', findings: [] };

    // Construct Context for LLM
    const fileContext = files.slice(0, 3).map(f =>
        `File: ${f.path}\nContent:\n${f.content ? f.content.substring(0, 1000) : 'No content'}`
    ).join('\n---\n');

    const prompt = `
        You are an expert code reviewer. Analyze the following code diffs.
        Provide a structured JSON output with a verdict (GOOD, RISKY, BAD),
        numerical scores (1-5) for security, correctness, maintainability, performance, testing,
        and a list of specific findings.
        
        Strict JSON format required matching:
        {
            "verdict": "GOOD" | "RISKY" | "BAD",
            "categories": { "security": int, "correctness": int, ... },
            "findings": [ { "file": string, "lineRange": [start, end], "message": string, "severity": int (1-5), "confidence": "high"|"medium"|"low" } ]
        }
    `;

    try {
        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash", generationConfig: { responseMimeType: "application/json" } });

        const result = await model.generateContent([prompt, fileContext]);
        const response = await result.response;
        const text = response.text();

        return JSON.parse(text);

    } catch (error) {
        console.error('LLM Scan Error (Gemini):', error);
        return {
            verdict: 'PENDING',
            categories: { security: 5, correctness: 5, maintainability: 5, performance: 5, testing: 5 },
            findings: [{ file: 'error', lineRange: [0, 0], message: 'AI Scan Failed: ' + error.message, severity: 1, confidence: 'low' }]
        };
    }
};

module.exports = { scan };

