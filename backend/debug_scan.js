const mongoose = require('mongoose');
const AnalysisOrchestrator = require('./services/analysisOrchestrator');
const GitHubService = require('./services/githubService');
require('dotenv').config();

// Mock dependencies
const mockIo = { emit: (event, data) => console.log(`[Event: ${event}]`, data) };

async function debugScan() {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('Connected to MongoDB');

        const repoUrl = 'https://github.com/facebook/react';
        const githubRegex = /github\.com\/([^\/]+)\/([^\/]+)/;
        const match = repoUrl.match(githubRegex);
        const owner = match[1];
        const repo = match[2];
        const repoId = `${owner}/${repo}`;

        console.log(`Testing scan for ${repoId}...`);

        const githubService = new GitHubService();
        const repoDetails = await githubService.getRepository(owner, repo);
        console.log('Repo Details:', repoDetails);

        const defaultBranch = repoDetails.defaultBranch || 'main';
        const files = await githubService.getRepositoryTree(owner, repo, defaultBranch);

        console.log(`Fetched ${files.length} files from GitHub`);

        // Check if files are being filtered out incorrectly
        const orchestrator = new AnalysisOrchestrator();
        const analyzableFiles = files.filter(f => orchestrator.shouldAnalyzeFile(f.path));
        console.log(`Analyzable files: ${analyzableFiles.length}`);

        if (analyzableFiles.length === 0) {
            console.error('CRITICAL: No files passed the filter!');
        }

        // Try to analyze ONE file to see if content fetching works
        if (analyzableFiles.length > 0) {
            const sampleFile = analyzableFiles[0];
            console.log(`Fetching content for sample file: ${sampleFile.path}`);

            const content = await githubService.getFileContent(owner, repo, sampleFile.path, defaultBranch);

            if (!content) {
                console.error('CRITICAL: Failed to fetch file content!');
            } else {
                console.log(`Successfully fetched ${content.length} bytes. Running analysis...`);

                // Mocking the file object structure expected by analyzeRepository
                const fileObj = { path: sampleFile.path, content };

                // We'll call analyzeRepository with just this one file to test
                await orchestrator.analyzeRepository(repoId, [fileObj], mockIo);
            }
        }

    } catch (error) {
        console.error('Debug script failed:', error);
    } finally {
        await mongoose.disconnect();
    }
}

debugScan();
