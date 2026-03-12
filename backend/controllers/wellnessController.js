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
            recommendations: responses.stressLevel >= 7
                ? ["Try a breathing exercise", "Take a short walk", "Talk to someone you trust"]
                : ["Keep up the good work!", "Stay hydrated"],
            alertLevel
        }
    });

    res.status(201).json(wellness);
});

// @desc    Get history
// @route   GET /api/wellness/history
// @access  Private
const getWellnessHistory = asyncHandler(async (req, res) => {
    const history = await Wellness.find({ userId: req.user._id }).sort('-createdAt').limit(10);
    res.status(200).json(history);
});

// @desc    Complete a wellness journey
// @route   POST /api/wellness/journey/complete
// @access  Private
const completeJourney = asyncHandler(async (req, res) => {
    const { pathId, completedActivities, moodBefore, moodAfter, results } = req.body;

    // Store journey data in wellness record
    const journeyData = {
        userId: req.user._id,
        checkInType: 'journey',
        responses: {
            pathId,
            completedActivities,
            moodBefore,
            moodAfter,
            journeyResults: results
        },
        aiAnalysis: {
            overallScore: moodAfter || 3,
            concerns: [],
            recommendations: ['Great job completing your wellness journey!'],
            alertLevel: 'none'
        }
    };

    const wellness = await Wellness.create(journeyData);

    res.status(201).json({
        success: true,
        message: 'Journey completed successfully!',
        data: wellness
    });
});

module.exports = {
    submitCheckin,
    getWellnessHistory,
    completeJourney
};
