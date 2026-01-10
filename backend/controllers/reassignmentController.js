const asyncHandler = require('express-async-handler');
const SmartReassignmentService = require('../services/smartReassignmentService');
const Task = require('../models/Task');

/**
 * ============================================================================
 * SMART REASSIGNMENT ASSISTANT CONTROLLER
 * ============================================================================
 * Handles API endpoints for intelligent task reassignment recommendations
 */

// @desc    Get reassignment recommendation for a task
// @route   GET /api/reassignment/:taskId/recommend
// @access  Private
const getReassignmentRecommendation = asyncHandler(async (req, res) => {
    const { taskId } = req.params;

    const recommendation = await SmartReassignmentService.getReassignmentRecommendation(taskId);

    if (!recommendation.success) {
        return res.status(200).json({
            success: false,
            message: recommendation.reason,
            data: null
        });
    }

    res.json({
        success: true,
        message: 'Recommendation generated successfully',
        data: {
            recommendation: recommendation.recommendation,
            currentAssignee: recommendation.currentAssignee,
            reason: recommendation.reason,
            score: recommendation.score,
            allCandidates: recommendation.allCandidates,
            taskDetails: {
                taskId: taskId,
                priority: recommendation.taskPriority
            }
        }
    });
});

// @desc    Execute reassignment (approve recommendation)
// @route   POST /api/reassignment/:taskId/execute
// @access  Private/Manager
const executeReassignment = asyncHandler(async (req, res) => {
    const { taskId } = req.params;
    const { newAssigneeId, requiresConfirmation } = req.body;

    if (!newAssigneeId) {
        res.status(400);
        throw new Error('newAssigneeId is required');
    }

    // Check authorization - only managers/leads can execute
    if (req.user.role !== 'admin' && 
        req.user.role !== 'project_manager' && 
        req.user.role !== 'technical_lead') {
        res.status(403);
        throw new Error('Not authorized to execute reassignment');
    }

    // Get task to check priority
    const task = await Task.findById(taskId);
    if (!task) {
        res.status(404);
        throw new Error('Task not found');
    }

    // High priority tasks might need confirmation
    if (task.priority === 'high' || task.priority === 'highest') {
        if (!requiresConfirmation) {
            return res.json({
                success: false,
                message: 'High-priority task requires manager confirmation',
                requiresConfirmation: true,
                taskPriority: task.priority
            });
        }
    }

    const result = await SmartReassignmentService.executeReassignment(
        taskId,
        newAssigneeId,
        req.user._id
    );

    if (!result.success) {
        res.status(400);
        throw new Error(result.message);
    }

    // Emit socket event
    const io = req.app.get('io');
    if (io) {
        io.emit('task:reassigned', {
            taskId,
            fromAssignee: result.fromAssignee,
            toAssignee: result.toAssignee,
            reassignedBy: req.user.fullName,
            timestamp: new Date()
        });
    }

    res.json({
        success: true,
        message: result.message,
        data: result
    });
});

// @desc    Get team workload analysis
// @route   GET /api/reassignment/team/analysis
// @access  Private
const getTeamWorkloadAnalysis = asyncHandler(async (req, res) => {
    const { sprintId } = req.query;

    const analysis = await SmartReassignmentService.getTeamWorkloadAnalysis(sprintId);

    res.json({
        success: true,
        data: analysis
    });
});

// @desc    Batch analyze all tasks for reassignment opportunities
// @route   POST /api/reassignment/batch-analyze
// @access  Private
const batchAnalyzeForReassignment = asyncHandler(async (req, res) => {
    const { sprintId } = req.body;

    // Get team analysis
    const analysis = await SmartReassignmentService.getTeamWorkloadAnalysis(sprintId);

    // Get overloaded employees and their tasks
    const recommendations = [];

    for (const employee of analysis.details.overloaded) {
        // Get tasks for overloaded employee
        let query = {
            assignedTo: employee.employeeId,
            status: { $in: ['todo', 'in_progress', 'review'] }
        };

        if (sprintId) {
            query.sprint = sprintId;
        }

        const tasks = await Task.find(query)
            .sort({ priority: -1, estimatedTime: 1 }) // High priority first, then small tasks
            .limit(3); // Analyze top 3 tasks

        for (const task of tasks) {
            const recommendation = await SmartReassignmentService.getReassignmentRecommendation(task._id);
            
            if (recommendation.success) {
                recommendations.push({
                    taskId: task._id,
                    taskTitle: task.title,
                    currentAssignee: recommendation.currentAssignee,
                    recommendation: recommendation.recommendation,
                    score: recommendation.score
                });
            }
        }
    }

    res.json({
        success: true,
        message: `Found ${recommendations.length} reassignment opportunities`,
        data: {
            teamAnalysis: analysis,
            reassignmentOpportunities: recommendations,
            summary: {
                overloadedEmployees: analysis.details.overloaded.length,
                reassignmentOpportunities: recommendations.length,
                averageWorkload: analysis.summary.avgWorkload
            }
        }
    });
});

module.exports = {
    getReassignmentRecommendation,
    executeReassignment,
    getTeamWorkloadAnalysis,
    batchAnalyzeForReassignment
};
