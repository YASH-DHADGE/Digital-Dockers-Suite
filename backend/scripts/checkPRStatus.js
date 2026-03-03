const mongoose = require('mongoose');
const PullRequest = require('../models/PullRequest');
const dotenv = require('dotenv');
const path = require('path');

// Load env vars
dotenv.config({ path: path.join(__dirname, '../.env') });

const checkPR = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('Connected to MongoDB');

        const pr = await PullRequest.findOne({ prId: 123 });
        if (pr) {
            console.log('PR Found:');
            console.log(JSON.stringify(pr, null, 2));
        } else {
            console.log('PR #123 not found');
        }

        process.exit();
    } catch (error) {
        console.error(error);
        process.exit(1);
    }
};

checkPR();
