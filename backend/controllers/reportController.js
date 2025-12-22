const asyncHandler = require('express-async-handler');
const Report = require('../models/Report');

// @desc    Generate Report
// @route   POST /api/reports/generate
// @access  Private
const generateReport = asyncHandler(async (req, res) => {
    // Placeholder for sophisticated report generation logic
    const { title, reportType, dataSource } = req.body;

    const report = await Report.create({
        title,
        generatedBy: req.user._id,
        reportType,
        dataSource,
        status: 'completed', // Simulated completion
        insights: {
            summary: "AI generated summary based on data",
            keyMetrics: [],
            recommendations: ["Optimize workflow", "Increase budget"],
            risks: ["Low engagement"]
        }
    });

    res.status(201).json(report);
});

// @desc    Get reports
// @route   GET /api/reports
// @access  Private
const getReports = asyncHandler(async (req, res) => {
    const reports = await Report.find({ generatedBy: req.user._id }).sort('-createdAt');
    res.status(200).json(reports);
});

module.exports = {
    generateReport,
    getReports
};
