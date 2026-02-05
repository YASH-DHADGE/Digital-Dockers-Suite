const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const CodebaseFile = require('../models/CodebaseFile');

async function checkDB() {
    try {
        console.log('Connecting to MongoDB...');
        await mongoose.connect(process.env.MONGO_URI);
        console.log('Connected.');

        const count = await CodebaseFile.countDocuments({ repoId: 'octocat/Hello-World' });
        console.log(`CodebaseFile count for 'octocat/Hello-World': ${count}`);

        const allFiles = await CodebaseFile.find({}).limit(5);
        console.log('Sample of ANY files in DB:', allFiles.map(f => f.repoId));

    } catch (error) {
        console.error('Error:', error);
    } finally {
        await mongoose.disconnect();
    }
}

checkDB();
