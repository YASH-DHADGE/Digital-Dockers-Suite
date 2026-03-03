const AnalysisOrchestrator = require('../services/analysisOrchestrator');
const fs = require('fs');
const path = require('path');
const os = require('os');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const mongoose = require('mongoose');

async function testPolyglot() {
    // 1. Setup Mock Repo with Python
    const tempDir = path.join(os.tmpdir(), `polyglot-test-${Date.now()}`);
    fs.mkdirSync(tempDir);

    // Python File
    const pyContent = `
def complex_algorithm(n):
    if n <= 1:
        return 1
    else:
        return n * complex_algorithm(n-1)

def another_one():
    print("hello")
    `;
    fs.writeFileSync(path.join(tempDir, 'main.py'), pyContent);

    // Java File
    const javaContent = `
public class HelloWorld {
    public static void main(String[] args) {
        System.out.println("Hello, World");
    }
}
    `;
    fs.writeFileSync(path.join(tempDir, 'HelloWorld.java'), javaContent); // Fixed filename

    console.log(`Created mock repo at ${tempDir}`);

    // 2. Run Analysis
    try {
        await mongoose.connect(process.env.MONGO_URI);
        const orchestrator = new AnalysisOrchestrator();
        const io = { emit: (ev, d) => { } };

        console.log('Running analysis...');
        const results = await orchestrator.analyzeLocalRepository('local/polyglot-test', tempDir, io);

        console.log('Analysis Results:', JSON.stringify(results.results, null, 2));

        // Assertions
        const pyFile = results.results.find(f => f.path.endsWith('main.py'));
        if (pyFile && pyFile.complexity > 0) {
            console.log('✅ Python analysis success (fallback logic worked).');
        } else {
            console.log('❌ Python analysis failed or returned zero complexity.');
        }

    } catch (e) {
        console.error('Test Failed:', e);
    } finally {
        await mongoose.disconnect();
        fs.rmSync(tempDir, { recursive: true, force: true });
    }
}

testPolyglot();
