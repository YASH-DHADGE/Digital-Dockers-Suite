const axios = require('axios');
const linter = require('./linterService');
const complexity = require('./complexityService');
const { analyzeCodeSemantic } = require('../openaiService');
const PullRequest = require('../../models/PullRequest');

const runAnalysis = async (pr) => {
    console.log(`Starting Analysis for PR #${pr.prId}...`);

    try {
        // 1. Fetch Code Diff
        // Note: In a real app, we need an installation token to access private repos. 
        // For public repos, this works. For private, we need GitHub App Auth.
        // Assuming public or accessible via raw URL for this MVP.
        const diffUrl = `https://api.github.com/repos/${pr.repo}/pulls/${pr.prId}`;
        // We actually need the 'diff' media type or just the file contents.
        // Let's use the diff_url stored in PR if available, else construct it.
        // The webhook payload usually has 'pull_request.diff_url' but we stored limited fields.
        // Let's assume we can fetch the diff. 
        // A robust way: fetch PR details from GitHub API to get the diff_url

        // Mocking the diff fetch for now if we don't have a token setup
        let codeDiff = "// Mock Diff\n const a = 10; \n if(a>5){ complex() }";

        try {
            // Attempt to fetch if it's a public repo, otherwise falls back to mock
            const prDetails = await axios.get(`https://api.github.com/repos/${pr.repo}/pulls/${pr.prId}`);
            const diffResponse = await axios.get(prDetails.data.diff_url);
            codeDiff = diffResponse.data;
        } catch (e) {
            console.warn('Could not fetch actual diff (likely private repo/no auth). Using mock diff for demonstration.');
        }

        // 2. Layer 1: Syntax (Linter)
        console.log('Running Layer 1: Syntax Analysis...');
        const syntaxResult = await linter.lintCode(codeDiff);
        pr.layers.syntax = {
            status: syntaxResult.status,
            errors: syntaxResult.errors.map(e => e.message)
        };
        await pr.save();

        // 3. Layer 2: Complexity (Ratchet)
        console.log('Running Layer 2: Complexity Analysis...');
        // We analyze the "After" code. In a real scenario, we parse the diff to reconstruct the file.
        // Here we just analyze the raw diff text as a proxy or assume we have the file content.
        // For accurate complexity, we need the full file content, not just the diff.
        // Simplified Logic: Analyze complexity of the diff itself (newly added code).
        const complexityResult = complexity.analyzeComplexity(codeDiff);

        // Ratchet Logic: Compare with previous health score (default 0 or fetch base branch)
        // If current score < previous score, it fails.
        // Note: Higher maintainability score is better.
        const previousScore = pr.healthScore.previous || 50; // Default baseline
        const ratchetFail = complexityResult.score < previousScore;

        pr.layers.complexity = {
            status: ratchetFail ? 'fail' : 'pass',
            score: complexityResult.score,
            detailedReport: complexityResult.detailedReport
        };
        pr.healthScore.current = complexityResult.score;
        pr.healthScore.delta = complexityResult.score - previousScore;
        await pr.save();

        // 4. Layer 3: Semantics (AI)
        console.log('Running Layer 3: Semantic Analysis...');
        // Context: We can use the PR Title and Jira Ticket (if any) as requirements.
        const requirements = `PR Title: ${pr.title}. Jira Ticket: ${pr.jiraTicket || 'None'}`;
        const semanticResult = await analyzeCodeSemantic(codeDiff, requirements);

        pr.layers.semantics = {
            status: semanticResult.status,
            aiAnalysis: semanticResult.analysis,
            securityRisks: semanticResult.securityRisks
        };
        await pr.save();

        // 5. Final Verdict
        const allPass =
            pr.layers.syntax.status === 'pass' &&
            pr.layers.complexity.status === 'pass' &&
            pr.layers.semantics.status === 'pass';

        pr.status = allPass ? 'approved' : 'blocked';
        await pr.save();

        console.log(`Analysis Complete. Verdict: ${pr.status}`);

    } catch (error) {
        console.error('Analysis Engine Failed:', error);
    }
};

module.exports = {
    runAnalysis
};
