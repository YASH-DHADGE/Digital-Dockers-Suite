const mongoose = require('mongoose');
const path = require('path');
const simpleGit = require('simple-git');
const fs = require('fs');
const os = require('os');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

async function verifyCryptAskClone() {
    console.log('\nTesting cloning of CryptAsk...');
    const repoUrl = 'https://github.com/SiddharajShirke/CryptAsk';

    let tempDir;
    try {
        tempDir = path.join(os.tmpdir(), `dd-debug-${Date.now()}`);
        if (!fs.existsSync(tempDir)) fs.mkdirSync(tempDir);

        console.log(`Cloning ${repoUrl} to ${tempDir}...`);
        const git = simpleGit();
        await git.clone(repoUrl, tempDir);
        console.log('✅ Clone success.');

        // Check finding files
        const AnalysisOrchestrator = require('../services/analysisOrchestrator');
        const orchestrator = new AnalysisOrchestrator();

        console.log('Running analysis...');
        // Mock socket
        const io = { emit: (ev, d) => console.log(`[Socket] ${ev}`, d) };
        const results = await orchestrator.analyzeLocalRepository('SiddharajShirke/CryptAsk', tempDir, io);

        console.log(`Analysis complete. Files analyzed: ${results.filesAnalyzed}`);

        // VERIFY DB
        const CodebaseFile = require('../models/CodebaseFile'); // Ensure path is correct relative to script location (usually ../models/File or CodebaseFile check require)
        // Wait, analysisOrchestrator uses ../models/CodebaseFile. Let's assume File.js or CodebaseFile.js
        // Previous check_db_data used ../models/File. 
        // AnalysisOrchestrator uses ../models/CodebaseFile.
        // Let's check which is correct.

        // I'll skip the require here and trust the global mongoose if model is compiled, 
        // or re-require the same one orchestrator uses.

        const count = await mongoose.model('CodebaseFile').countDocuments({ repoId: 'SiddharajShirke/CryptAsk' });
        console.log(`[DEBUG VERIFY] Documents in DB for SiddharajShirke/CryptAsk: ${count}`);

        const analyzedPaths = results.results ? results.results.map(r => r.path) : [];
        console.log('Analyzed paths debug:', analyzedPaths);
        try {
            fs.writeFileSync('debug_analysis_results.log', analyzedPaths.join('\n'), 'utf8');
            console.log('Analyzed paths successfully written to debug_analysis_results.log');
        } catch (err) {
            console.error('Error writing log:', err);
        }

        console.log('Checking directory walk...');
        const files = await orchestrator.walkDirectory(tempDir);
        console.log(`Total files found by walker: ${files.length}`);

        fs.writeFileSync('debug_files_list.log', files.join('\n'));
        const basenames = files.map(f => path.basename(f));
        fs.writeFileSync('debug_basenames.log', basenames.join('\n'));
        console.log('Basenames written to debug_basenames.log');

        const probeLog = [];
        const gitStatus = await git.status();
        probeLog.push(`Git Status: ${JSON.stringify(gitStatus, null, 2)}`);

        try {
            const readme = fs.readFileSync(path.join(tempDir, 'README.md'), 'utf8');
            probeLog.push(`README Content Preview:\n${readme.substring(0, 200)}`);
        } catch (e) {
            probeLog.push('No README found.');
        }

        console.log('Listing remote branches...');
        const branches = await git.listRemote(['--heads', repoUrl]);
        // Parse "hash\trefs/heads/name"
        const branchNames = branches.split('\n')
            .filter(line => line.trim().length > 0)
            .map(line => line.split('\t')[1]?.replace('refs/heads/', ''))
            .filter(Boolean);

        probeLog.push(`Remote Branches: ${branchNames.join(', ')}`);

        const backendPath = path.join(tempDir, 'backend');
        if (fs.existsSync(backendPath)) {
            probeLog.push('Backend folder EXISTS.');
            const stat = fs.statSync(backendPath);
            probeLog.push(`Is Directory? ${stat.isDirectory()}`);
            const backendFiles = fs.readdirSync(backendPath);
            probeLog.push(`Backend contents: ${backendFiles.join(', ')}`);
        } else {
            probeLog.push('Backend folder DOES NOT EXIST.');
            const rootFiles = fs.readdirSync(tempDir);
            probeLog.push(`Root files found: ${rootFiles.join(', ')}`);
        }

        fs.writeFileSync('debug_probe.log', probeLog.join('\n'));
        console.log('Probe log written to debug_probe.log');
        console.log(`TEMP DIR: ${tempDir}`);

    } catch (e) {
        console.log('❌ Clone failed.');
        console.error(e);
    } finally {
        // if (tempDir && fs.existsSync(tempDir)) {
        //     console.log(`Cleaning up temporary directory: ${tempDir}`);
        //     fs.rmSync(tempDir, { recursive: true, force: true });
        // }
    }
}

verifyCryptAskClone();
