const asyncHandler = require('express-async-handler');
const Insight = require('../models/Insight');

// @desc    Analyze Data file
// @route   POST /api/insights/upload
// @access  Private
const uploadData = asyncHandler(async (req, res) => {
    if (!req.file) {
        res.status(400);
        throw new Error('Please upload a file');
    }

    const insight = await Insight.create({
        userId: req.user._id,
        title: req.body.title || req.file.originalname,
        sourceFile: {
            filename: req.file.filename,
            filepath: req.file.path,
            mimetype: req.file.mimetype
        },
        sourceType: 'csv', // detect based on extension
        status: 'processing'
    });

    // Mock Analysis
    insight.analysis = {
        summary: "Data shows positive trend primarily.",
        trends: [{ metric: "Revenue", direction: 'up', percentage: 15, significance: "High" }],
        anomalies: ["Spike in Q3"],
        visualizations: []
    };
    insight.status = 'completed';
    await insight.save();

    res.status(201).json(insight);
});

// @desc    Get Insights
// @route   GET /api/insights
// @access  Private
const getInsights = asyncHandler(async (req, res) => {
    const insights = await Insight.find({ userId: req.user._id }).sort('-createdAt');
    res.status(200).json(insights);
});

module.exports = {
    uploadData,
    getInsights
};
