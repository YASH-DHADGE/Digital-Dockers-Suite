const mongoose = require('mongoose');

const MessageSchema = new mongoose.Schema({
    room: {
        type: String,
        required: true,
        index: true
    },
    author: {
        type: String, // Username or User ID? Using username/author name for simplicity as per socket data
        required: true
    },
    message: {
        type: String,
        required: true
    },
    time: {
        type: String,
        required: true
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model('Message', MessageSchema);
