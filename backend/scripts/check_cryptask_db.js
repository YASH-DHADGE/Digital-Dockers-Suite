const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const CodebaseFile = require('../models/CodebaseFile');

async function checkCryptAsk() {
    try {
        console.log('Connecting to MongoDB...');
        await mongoose.connect(process.env.MONGO_URI);

        // Allow some time for async analysis to finish if running immediately after trigger
        // But for this check script, we just query what is there now.

        const repoId = 'SiddharajShirke/CryptAsk';
        const count = await CodebaseFile.countDocuments({ repoId });
        console.log(`\n📊 Analysis Report for ${repoId}:`);
        console.log(`-----------------------------------`);
        console.log(`Total Files Analyzed: ${count}`);

        if (count > 0) {
            const sample = await CodebaseFile.findOne({ repoId });
            console.log('Sample File:', sample.path);
            console.log('Complexity:', sample.complexity);
            console.log('LOC:', sample.loc);
        } else {
            console.log('⚠️ No files found yet. Analysis might still be running or repo is empty.');
        }

    } catch (error) {
        console.error('Error:', error);
    } finally {
        await mongoose.disconnect();
    }
}

checkCryptAsk();
