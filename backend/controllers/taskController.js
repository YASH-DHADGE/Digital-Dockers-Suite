const asyncHandler = require('express-async-handler');
const Task = require('../models/Task');
const { analyzeTask } = require('../services/openaiService');

// @desc    Create new task
// @route   POST /api/tasks
// @access  Private
const createTask = asyncHandler(async (req, res) => {
    const { title, description, deadline, assignedTo } = req.body;

    if (!title) {
        res.status(400);
        throw new Error('Please add a task title');
    }

    // AI Analysis
    const aiAnalysis = await analyzeTask(description, deadline);

    const task = await Task.create({
        title,
        description,
        priority: aiAnalysis.priority || 'medium',
        status: 'todo',
        assignedTo: assignedTo || [req.user._id],
        assignedBy: req.user._id,
        dueDate: deadline,
        aiSuggestions: {
            timeBreakdown: aiAnalysis.timeBreakdown,
            dependencies: aiAnalysis.dependencies
        }
    });

    res.status(201).json(task);
});

// @desc    Get all tasks
// @route   GET /api/tasks
// @access  Private
const getTasks = asyncHandler(async (req, res) => {
    let query = {
        $or: [{ assignedTo: req.user._id }, { assignedBy: req.user._id }]
    };

    // Allow Admin and Leaders to see all tasks
    const fullAccessRoles = ['admin', 'Project Manager', 'Technical Lead'];
    if (fullAccessRoles.includes(req.user.role)) {
        query = {}; // No filter, return all
    }

    const tasks = await Task.find(query)
        .populate('assignedTo', 'fullName email')
        .populate('assignedBy', 'fullName')
        .sort('-createdAt');

    res.status(200).json(tasks);
});

module.exports = {
    createTask,
    getTasks
};
