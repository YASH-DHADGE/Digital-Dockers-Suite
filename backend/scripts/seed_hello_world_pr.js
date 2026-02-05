const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const PullRequest = require('../models/PullRequest');

async function seedPR() {
    try {
        console.log('Connecting to MongoDB...');
        await mongoose.connect(process.env.MONGO_URI);
        console.log('Connected.');

        const repoId = 'octocat/Hello-World';

        console.log(`Seeding PR for ${repoId}...`);

        await PullRequest.create({
            repoId,
            prNumber: 42,
            title: 'Refactor Authentication Logic',
            author: 'octocat',
            status: 'BLOCK',
            healthScore: { current: 45, context: 'High complexity detected' },
            analysisResults: {
                lint: { errors: 3, warnings: 1 },
                complexity: { healthScoreDelta: -10 },
                aiScan: { verdict: 'BAD', findings: [{ message: 'Potential security risk in auth.js' }] }
            },
            createdAt: new Date()
        });

        console.log('✅ Seeded 1 dummy PR.');

    } catch (error) {
        console.error('Error:', error);
    } finally {
        await mongoose.disconnect();
    }
}

seedPR();
