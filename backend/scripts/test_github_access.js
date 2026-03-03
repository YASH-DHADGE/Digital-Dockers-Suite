const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const GitHubService = require('../services/githubService');

async function testGithubAccess() {
    try {
        console.log('Checking GITHUB_TOKEN...');
        if (!process.env.GITHUB_TOKEN) {
            console.error('ERROR: GITHUB_TOKEN is missing in .env');
            return;
        }
        console.log('Token present (length):', process.env.GITHUB_TOKEN.length);

        const gh = new GitHubService();
        console.log('Attempting to fetch repo details for octocat/Hello-World...');

        const details = await gh.getRepository('octocat', 'Hello-World');
        console.log('Success! Connected to GitHub.');
        console.log('Repo Name:', details.name);
        console.log('Default Branch:', details.defaultBranch);

    } catch (error) {
        console.error('GitHub Access Test Failed!');
        console.error('Error Message:', error.message);
        if (error.response) {
            console.error('API Status:', error.response.status);
            console.error('API Data:', error.response.data);
        }
    }
}

testGithubAccess();
