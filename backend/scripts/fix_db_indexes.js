const mongoose = require('mongoose');
require('dotenv').config({ path: '../.env' });

async function fixIndexes() {
    try {
        console.log('Connecting to MongoDB...');
        await mongoose.connect(process.env.MONGO_URI);
        console.log('Connected.');

        const collection = mongoose.connection.collection('codebasefiles');

        console.log('Listing indexes...');
        const indexes = await collection.indexes();
        console.log(indexes);

        console.log('Dropping all indexes (except _id)...');
        await collection.dropIndexes();
        console.log('Indexes dropped. Mongoose will recreate them on next app start.');

    } catch (error) {
        console.error('Error fixing indexes:', error);
    } finally {
        await mongoose.disconnect();
    }
}

fixIndexes();
