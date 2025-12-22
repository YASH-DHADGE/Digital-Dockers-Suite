const asyncHandler = require('express-async-handler');
const Wellness = require('../models/Wellness');

// @desc    Submit Check-in
// @route   POST /api/wellness/checkin
// @access  Private
const submitCheckin = asyncHandler(async (req, res) => {
    const { responses, checkInType } = req.body;

    // AI Analysis Stub
    // Detect burnout if stress > 8 or mood < neutral
    let alertLevel = 'none';
    if (responses.stressLevel >= 8) alertLevel = 'urgent';
    else if (responses.stressLevel >= 6) alertLevel = 'caution';

    const wellness = await Wellness.create({
        userId: req.user._id,
        checkInType: checkInType || 'daily',
        responses,
        aiAnalysis: {
            overallScore: 10 - responses.stressLevel, // Simple calculation
            concerns: responses.stressLevel > 5 ? ["High Stress"] : [],
            recommendations: ["Take a break", "Meditation"],
            alertLevel
        }
    });

    res.status(201).json(wellness);
});

// @desc    Get history
// @route   GET /api/wellness/history
// @access  Private
const getWellnessHistory = asyncHandler(async (req, res) => {
    const history = await Wellness.find({ userId: req.user._id }).sort('-createdAt');
    res.status(200).json(history);
});

module.exports = {
    submitCheckin,
    getWellnessHistory
};
