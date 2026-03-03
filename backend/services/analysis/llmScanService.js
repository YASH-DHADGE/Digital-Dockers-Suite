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
        
        IMPORTANT: Respond ONLY with valid JSON, no markdown or extra text.
        
        JSON format:
        {
            "verdict": "GOOD",
            "categories": { "security": 5, "correctness": 5, "maintainability": 5, "performance": 5, "testing": 3 },
            "findings": []
        }
        
        Use GOOD if code looks clean, RISKY if there are minor concerns, BAD if there are serious issues.
    `;

    try {
        // Use gemini-1.5-flash-latest model
        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash-latest" });

        const result = await model.generateContent(prompt + "\n\nCode to analyze:\n" + fileContext);
        const response = await result.response;
        const text = response.text();
        
        // Try to extract JSON from response
        let jsonText = text;
        
        // Remove markdown code blocks if present
        const jsonMatch = text.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
        if (jsonMatch) {
            jsonText = jsonMatch[1];
        }
        
        // Clean up the text
        jsonText = jsonText.trim();
        
        const parsed = JSON.parse(jsonText);
        console.log('[Gemini] AI Analysis complete:', parsed.verdict);
        return parsed;

    } catch (error) {
        console.error('LLM Scan Error (Gemini):', error.message);
        return {
            verdict: 'PENDING',
            categories: { security: 5, correctness: 5, maintainability: 5, performance: 5, testing: 5 },
            findings: [{ file: 'error', lineRange: [0, 0], message: 'AI Scan Failed: ' + error.message, severity: 1, confidence: 'low' }]
        };
    }
};

module.exports = { scan };

