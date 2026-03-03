const express = require('express');
const router = express.Router();
const AnalysisOrchestrator = require('../services/analysisOrchestrator');
const GitHubService = require('../services/githubService');
const CodebaseFile = require('../models/CodebaseFile');
const PullRequest = require('../models/PullRequest');

/**
 * Run full repository scan
 */
router.post('/run-full-scan', async (req, res) => {
    try {
        const { repoId, owner, repo } = req.body;

        if (!repoId || !owner || !repo) {
            return res.status(400).json({
                error: 'repoId, owner, and repo are required'
            });
        }

        const io = req.app.get('io');
        const githubService = new GitHubService();

        // Get repository files
        const files = await githubService.getRepositoryTree(owner, repo);

        // Fetch content for analyzable files
        const filesWithContent = [];
        for (const file of files.slice(0, 100)) {
            const content = await githubService.getFileContent(owner, repo, file.path);
            if (content) {
                filesWithContent.push({
                    path: file.path,
                    content
                });
            }
        }

        // Analyze
        const orchestrator = new AnalysisOrchestrator();
        const result = await orchestrator.analyzeRepository(repoId, filesWithContent, io);

        res.status(200).json(result);
    } catch (error) {
        console.error('Full scan error:', error);
        res.status(500).json({ error: error.message });
    }
});

/**
 * Get metrics for a specific file
 */
router.get('/files/:fileId/metrics', async (req, res) => {
    try {
        const { fileId } = req.params;

        const file = await CodebaseFile.findById(fileId);

        if (!file) {
            return res.status(404).json({ error: 'File not found' });
        }

        res.status(200).json(file);
    } catch (error) {
        console.error('Error fetching file metrics:', error);
        res.status(500).json({ error: error.message });
    }
});

/**
 * Analyze a specific PR
 */
router.post('/pr/:prId/analyze', async (req, res) => {
    try {
        const { prId } = req.params;
        const { owner, repo, prNumber } = req.body;

        if (!owner || !repo || !prNumber) {
            return res.status(400).json({
                error: 'owner, repo, and prNumber are required'
            });
        }

        const io = req.app.get('io');
        const githubService = new GitHubService();

        // Get PR data
        const prs = await githubService.getPullRequests(owner, repo);
        const pr = prs.find(p => p.prNumber === parseInt(prNumber));

        if (!pr) {
            return res.status(404).json({ error: 'PR not found' });
        }

        // Get files changed
        const filesChanged = await githubService.getFilesChanged(owner, repo, prNumber);

        // Analyze
        const orchestrator = new AnalysisOrchestrator();
        const result = await orchestrator.analyzePR(
            { ...pr, repoId: `${owner}/${repo}` },
            filesChanged,
            io
        );

        res.status(200).json(result);
    } catch (error) {
        console.error('PR analysis error:', error);
        res.status(500).json({ error: error.message });
    }
});

/**
 * Get analysis status for a PR
 */
router.get('/pr/:prId/status', async (req, res) => {
    try {
        const { prId } = req.params;

        const pr = await PullRequest.findById(prId);

        if (!pr) {
            return res.status(404).json({ error: 'PR not found' });
        }

        res.status(200).json({
            prNumber: pr.prNumber,
            status: pr.status,
            healthScore: pr.healthScore,
            analysisResults: pr.analysisResults
        });
    } catch (error) {
        console.error('Error fetching PR status:', error);
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;
