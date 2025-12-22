const fs = require('fs');
const path = require('path');
const pdf = require('pdf-parse');
const mammoth = require('mammoth');
const officeParser = require('officeparser');
const { Ollama } = require('ollama');

// Initialize Local Ollama (Official SDK - NO API calls, 100% private)
// Ollama runs on localhost:11434 - install from ollama.com
const ollama = new Ollama({ host: 'http://localhost:11434' });
const MODEL_NAME = 'gemma2:2b'; // User can change to llama3.2:3b, mistral, etc.

// Parse Document Content
const parseDocument = async (filePath, mimetype) => {
    try {
        let text = '';
        const ext = path.extname(filePath).toLowerCase();

        if (mimetype === 'application/pdf' || ext === '.pdf') {
            const dataBuffer = fs.readFileSync(filePath);
            const pdfData = await pdf(dataBuffer);
            text = pdfData.text;
        } else if (
            mimetype === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
            ext === '.docx'
        ) {
            const result = await mammoth.extractRawText({ path: filePath });
            text = result.value;
        } else if (
            mimetype === 'application/vnd.openxmlformats-officedocument.presentationml.presentation' ||
            ext === '.pptx' ||
            ext === '.ppt'
        ) {
            text = await officeParser.parseOfficeAsync(filePath);
        } else {
            text = fs.readFileSync(filePath, 'utf8');
        }

        return text.replace(/\s+/g, ' ').trim();
    } catch (error) {
        console.error("Error parsing document:", error);
        throw new Error("Failed to parse document content. Ensure the file is not corrupted.");
    }
};

// Generate Summary using Ollama
const summarizeDocument = async (text) => {
    const context = text.substring(0, 100000);

    const prompt = `You are a helpful assistant. Summarize the following document in a concise but comprehensive manner. 
Highlight key points, important dates, and specific action items if any.

Document Content:
${context}

Summary:`;

    try {
        const response = await ollama.generate({
            model: MODEL_NAME,
            prompt: prompt,
            stream: false
        });

        return response.response;
    } catch (error) {
        console.error("Ollama error:", error);
        throw new Error("Failed to generate summary. Make sure Ollama is running and the model is downloaded.");
    }
};

// Answer Question using Ollama
const chatWithDocument = async (text, question) => {
    const context = text.substring(0, 100000);

    const prompt = `You are a helpful assistant. Answer the question based strictly on the following context.
If the answer is not in the context, say "I cannot find the answer in the provided document."

Context:
${context}

Question: ${question}

Answer:`;

    try {
        const response = await ollama.generate({
            model: MODEL_NAME,
            prompt: prompt,
            stream: false
        });

        return response.response;
    } catch (error) {
        console.error("Ollama error:", error);
        throw new Error("Failed to answer question. Make sure Ollama is running and the model is downloaded.");
    }
};

module.exports = {
    parseDocument,
    summarizeDocument,
    chatWithDocument
};
