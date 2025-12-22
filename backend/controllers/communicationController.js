const asyncHandler = require('express-async-handler');
const Communication = require('../models/Communication');

// @desc    Analyze Communication (Text)
// @route   POST /api/communication/analyze-text
// @access  Private
const analyzeText = asyncHandler(async (req, res) => {
    const { text, sessionType } = req.body;

    // AI Analysis Stub
    const analysisResult = {
        translatedText: null,
        coaching: {
            analysis: "Good clarity but tone is slightly aggressive.",
            strengths: ["Directness"],
            improvements: ["Soften language"],
            toneScore: 7,
            clarityScore: 9,
            suggestions: ["Use 'could' instead of 'must'"]
        }
    };

    const comm = await Communication.create({
        userId: req.user._id,
        sessionType: sessionType || 'communication_coaching',
        input: { text },
        output: analysisResult
    });

    res.status(201).json(comm);
});

// @desc    Get history
// @route   GET /api/communication/history
// @access  Private
const getHistory = asyncHandler(async (req, res) => {
    const history = await Communication.find({ userId: req.user._id }).sort('-createdAt');
    res.status(200).json(history);
});

module.exports = {
    analyzeText,
    getHistory
};
