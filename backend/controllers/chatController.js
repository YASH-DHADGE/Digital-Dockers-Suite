const asyncHandler = require('express-async-handler');
const Message = require('../models/Message');

// @desc    Get Chat History
// @route   GET /api/chat/history/:room
// @access  Private
const getChatHistory = asyncHandler(async (req, res) => {
    const { room } = req.params;

    const messages = await Message.find({ room }).sort({ createdAt: 1 });
    res.status(200).json(messages);
});

module.exports = {
    getChatHistory
};
