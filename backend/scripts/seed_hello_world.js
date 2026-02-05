const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const CodebaseFile = require('../models/CodebaseFile');

async function seedData() {
    try {
        console.log('Connecting to MongoDB...');
        await mongoose.connect(process.env.MONGO_URI);
        console.log('Connected.');

        const repoId = 'octocat/Hello-World';

        console.log(`Seeding data for ${repoId}...`);

        const dummyFiles = [
            { path: 'src/index.js', loc: 150, complexity: 12, risk: 45, churnRate: 0.8 },
            { path: 'src/utils/helpers.js', loc: 80, complexity: 5, risk: 10, churnRate: 0.2 },
            { path: 'src/components/Button.js', loc: 200, complexity: 25, risk: 80, churnRate: 1.5 },
            { path: 'server.js', loc: 300, complexity: 30, risk: 90, churnRate: 2.0 },
        ];

        for (const file of dummyFiles) {
            await CodebaseFile.findOneAndUpdate(
                { repoId, path: file.path },
                {
                    $set: {
                        loc: file.loc,
                        complexity: file.complexity,
                        risk: file.risk,
                        churnRate: file.churnRate,
                        lastAnalyzed: new Date(),
                        dependencies: []
                    },
                    $push: {
                        historicalMetrics: {
                            date: new Date(),
                            complexity: file.complexity,
                            loc: file.loc,
                            risk: file.risk
                        }
                    }
                },
                { upsert: true, new: true }
            );
        }

        console.log('✅ Seeded 4 dummy files.');

    } catch (error) {
        console.error('Error:', error);
    } finally {
        await mongoose.disconnect();
    }
}

seedData();
