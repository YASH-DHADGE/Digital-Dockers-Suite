const { Octokit } = require('@octokit/rest');
const simpleGit = require('simple-git');
const path = require('path');
const fs = require('fs').promises;

class GitHubService {
    constructor(token) {
        this.octokit = new Octokit({
            auth: token || process.env.GITHUB_TOKEN
        });
    }

    /**
     * Get authenticated user's repositories
     */
    async getRepositories() {
        try {
            const { data } = await this.octokit.repos.listForAuthenticatedUser({
                sort: 'updated',
                per_page: 100
            });

            return data.map(repo => ({
                id: repo.id,
                name: repo.name,
                fullName: repo.full_name,
                owner: repo.owner.login,
                url: repo.html_url,
                defaultBranch: repo.default_branch,
                language: repo.language,
                private: repo.private
            }));
        } catch (error) {
            console.error('Error fetching repositories:', error);
            throw error;
        }
    }

    /**
     * Get pull requests for a repository
     */
    async getPullRequests(owner, repo, state = 'all') {
        try {
            const { data } = await this.octokit.pulls.list({
                owner,
                repo,
                state,
                per_page: 100,
                sort: 'updated',
                direction: 'desc'
            });

            return data.map(pr => ({
                prNumber: pr.number,
                title: pr.title,
                author: pr.user.login,
                url: pr.html_url,
                branch: pr.head.ref,
                status: pr.state,
                createdAt: pr.created_at,
                updatedAt: pr.updated_at,
                filesChanged: [] // Will be populated by getFilesChanged
            }));
        } catch (error) {
            console.error('Error fetching pull requests:', error);
            throw error;
        }
    }

    /**
     * Get files changed in a pull request
     */
    async getFilesChanged(owner, repo, prNumber) {
        try {
            const { data } = await this.octokit.pulls.listFiles({
                owner,
                repo,
                pull_number: prNumber,
                per_page: 100
            });

            return data.map(file => ({
                filename: file.filename,
                status: file.status, // added, removed, modified
                additions: file.additions,
                deletions: file.deletions,
                changes: file.changes,
                patch: file.patch
            }));
        } catch (error) {
            console.error('Error fetching files changed:', error);
            throw error;
        }
    }

    /**
     * Get file content from repository
     */
    async getFileContent(owner, repo, path, ref = 'main') {
        try {
            const { data } = await this.octokit.repos.getContent({
                owner,
                repo,
                path,
                ref
            });

            if (data.type === 'file') {
                const content = Buffer.from(data.content, 'base64').toString('utf-8');
                return content;
            }
            return null;
        } catch (error) {
            console.error('Error fetching file content:', error);
            return null;
        }
    }

    /**
     * Get commit history for a file (for churn analysis)
     */
    async getFileCommitHistory(owner, repo, filePath, since = null) {
        try {
            const params = {
                owner,
                repo,
                path: filePath,
                per_page: 100
            };

            if (since) {
                params.since = since;
            }

            const { data } = await this.octokit.repos.listCommits(params);
            return data.length; // Return commit count
        } catch (error) {
            console.error('Error fetching commit history:', error);
            return 0;
        }
    }

    /**
     * Get PR diff
     */
    async getPRDiff(owner, repo, prNumber) {
        try {
            const { data } = await this.octokit.pulls.get({
                owner,
                repo,
                pull_number: prNumber,
                mediaType: {
                    format: 'diff'
                }
            });

            return data;
        } catch (error) {
            console.error('Error fetching PR diff:', error);
            throw error;
        }
    }

    /**
     * Clone repository for local analysis
     */
    async cloneRepository(owner, repo, targetDir) {
        try {
            const repoUrl = `https://github.com/${owner}/${repo}.git`;
            const git = simpleGit();

            await git.clone(repoUrl, targetDir);
            return targetDir;
        } catch (error) {
            console.error('Error cloning repository:', error);
            throw error;
        }
    }

    /**
     * Get all files in repository
     */
    async getRepositoryTree(owner, repo, branch = 'main') {
        try {
            const { data } = await this.octokit.git.getTree({
                owner,
                repo,
                tree_sha: branch,
                recursive: true
            });

            return data.tree
                .filter(item => item.type === 'blob') // Only files
                .map(item => ({
                    path: item.path,
                    sha: item.sha,
                    size: item.size
                }));
        } catch (error) {
            console.error('Error fetching repository tree:', error);
            throw error;
        }
    }

    /**
     * Verify webhook signature
     */
    static verifyWebhookSignature(payload, signature, secret) {
        const crypto = require('crypto');
        const hmac = crypto.createHmac('sha256', secret);
        const digest = 'sha256=' + hmac.update(payload).digest('hex');
        return crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(digest));
    }
}

module.exports = GitHubService;
