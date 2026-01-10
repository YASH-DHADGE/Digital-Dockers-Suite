const asyncHandler = require('express-async-handler');
const { generateResponse } = require('../services/geminiService');
const Task = require('../models/Task');
const Meeting = require('../models/Meeting');
const Project = require('../models/Project');

// @desc    Send message to chatbot
// @route   POST /api/chatbot/message
// @access  Private
const sendMessage = asyncHandler(async (req, res) => {
    const { message } = req.body;
    const userId = req.user._id;

    if (!message || message.trim().length === 0) {
        res.status(400);
        throw new Error('Message is required');
    }

    // Gather user context for personalized responses
    const userContext = {
        user: {
            fullName: req.user.fullName,
            role: req.user.role,
            email: req.user.email
        }
    };

    try {
        // Get user's tasks
        const tasks = await Task.find({
            $or: [
                { assignedTo: userId },
                { assignedBy: userId }
            ],
            status: { $ne: 'done' }
        })
            .populate('project', 'name key')
            .sort({ priority: -1, dueDate: 1 })
            .limit(10);

        userContext.tasks = tasks;

        // Get upcoming meetings
        const meetings = await Meeting.find({
            $or: [
                { createdBy: userId },
                { attendees: userId }
            ],
            scheduledAt: { $gte: new Date() }
        })
            .sort({ scheduledAt: 1 })
            .limit(5);

        userContext.meetings = meetings;

        // Get user's projects
        const projects = await Project.find({
            $or: [
                { lead: userId },
                { members: userId },
                { createdBy: userId }
            ]
        })
            .select('name key')
            .limit(5);

        userContext.projects = projects;

    } catch (error) {
        console.error('Error fetching user context:', error);
        // Continue without context if fetch fails
    }

    // Generate response
    const response = await generateResponse(message, userContext);

    res.json({
        success: true,
        message: response,
        timestamp: new Date().toISOString()
    });
});

// @desc    Get chatbot welcome message
// @route   GET /api/chatbot/welcome
// @access  Private
const getWelcome = asyncHandler(async (req, res) => {
    const userName = req.user.fullName?.split(' ')[0] || 'there';

    res.json({
        success: true,
        message: `Hi ${userName}! 👋 I'm DockerBot, your AI assistant. I can help you with tasks, meetings, navigation, and more. What would you like to know?`,
        suggestions: [
            "What are my pending tasks?",
            "When is my next meeting?",
            "How do I create a sprint?",
            "What should I work on today?",
            "How does the AI Email work?",
            "Show me the dashboard features"
        ]
    });
});

module.exports = {
    sendMessage,
    getWelcome
};
