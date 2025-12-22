const OpenAI = require('openai');
const fs = require('fs');
const path = require('path');

// Initialize OpenAI
// Note: Requires OPENAI_API_KEY in .env
const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY || 'dummy-key',
});

// Transcribe audio using Whisper
const transcribeAudio = async (filePath) => {
    try {
        if (!process.env.OPENAI_API_KEY) {
            console.warn('OPENAI_API_KEY is missing. Returning dummy transcript.');
            return "This is a dummy transcript because the API key is missing. The meeting discussed project timelines and deliverables. Action items were assigned to the team.";
        }

        const transcription = await openai.audio.transcriptions.create({
            file: fs.createReadStream(filePath),
            model: "whisper-1",
            response_format: "text",
        });

        return transcription;
    } catch (error) {
        console.error('OpenAI Transcription Error:', error);
        throw error;
    }
};

// Summarize text using GPT-4
const summarizeMeeting = async (transcript) => {
    try {
        if (!process.env.OPENAI_API_KEY) {
            console.warn('OPENAI_API_KEY is missing. Returning dummy summary.');
            return {
                overview: "Meeting overview (dummy)",
                keyPoints: ["Point 1", "Point 2"],
                decisions: ["Decision A"],
                actionItems: ["Action 1", "Action 2"],
                nextSteps: ["Step 1"]
            };
        }

        const completion = await openai.chat.completions.create({
            messages: [
                {
                    role: "system",
                    content: "You are a helpful assistant that summarizes meeting transcripts. Extract: 1) Overview, 2) Key points discussed, 3) Decisions made, 4) Action items, 5) Next steps. Output as JSON."
                },
                { role: "user", content: transcript }
            ],
            model: "gpt-4-turbo",
            response_format: { type: "json_object" },
        });

        return JSON.parse(completion.choices[0].message.content);
    } catch (error) {
        console.error('OpenAI Summarization Error:', error);
        throw error;
    }
};

// Analyze task for changes
const analyzeTask = async (taskDescription, deadline) => {
    try {
        if (!process.env.OPENAI_API_KEY) {
            return { priority: 'medium', timeBreakdown: [], dependencies: [] };
        }
        const completion = await openai.chat.completions.create({
            messages: [
                { role: "system", content: "Analyze the task. Provide JSON: priority, timeBreakdown (phase, duration), dependencies." },
                { role: "user", content: `Task: ${taskDescription}, Deadline: ${deadline}` }
            ],
            model: "gpt-4-turbo",
            response_format: { type: "json_object" }
        });
        return JSON.parse(completion.choices[0].message.content);
    } catch (error) {
        console.error('Task Analysis Error:', error);
        throw error;
    }
};

// Generate Email
const generateEmailContent = async (bulletPoints, context, tone) => {
    try {
        if (!process.env.OPENAI_API_KEY) {
            return { subject: "Dummy Subject", body: "Dummy Body" };
        }
        const completion = await openai.chat.completions.create({
            messages: [
                { role: "system", content: "Generate an email based on inputs. Output JSON: subject, body." },
                { role: "user", content: `Points: ${bulletPoints}, Context: ${context}, Tone: ${tone}` }
            ],
            model: "gpt-4-turbo",
            response_format: { type: "json_object" }
        });
        return JSON.parse(completion.choices[0].message.content);
    } catch (error) {
        console.error('Email Generation Error:', error);
        throw error;
    }
}

module.exports = {
    transcribeAudio,
    summarizeMeeting,
    analyzeTask,
    generateEmailContent
};
