const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const CodebaseFile = require('../models/CodebaseFile');
const PullRequest = require('../models/PullRequest');

async function checkData() {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('Connected to DB');

        console.log('\n--- Codebase Files (CryptAsk) ---');
        const query = { repoId: { $regex: 'CryptAsk', $options: 'i' } };
        const files = await CodebaseFile.find(query, 'repoId path').limit(20);
        if (files.length === 0) {
            console.log('No files found in DB.');
        } else {
            console.log(`Found ${await CodebaseFile.countDocuments()} total files.`);
            console.log('Sample Data:');
            files.forEach(f => console.log(`[${f.repoId}] ${f.path}`));
        }

        console.log('\n--- Pull Requests ---');
        const prs = await PullRequest.find({}, 'repoId title').limit(20);
        if (prs.length === 0) {
            console.log('No PRs found in DB.');
        } else {
            console.log(`Found ${await PullRequest.countDocuments()} total PRs.`);
            prs.forEach(p => console.log(`[${p.repoId}] ${p.title}`));
        }

    } catch (err) {
        console.error(err);
    } finally {
        await mongoose.disconnect();
    }
}

checkData();
