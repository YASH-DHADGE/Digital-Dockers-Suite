const asyncHandler = require('express-async-handler');
const WorkloadBalancingService = require('../services/workloadBalancingService');

/**
 * ============================================================================
 * WORKLOAD CONTROLLER
 * ============================================================================
 * Handles workload calculations and automatic rebalancing endpoints
 */

// @desc    Get workload for a specific user
// @route   GET /api/workload/:userId
// @access  Private
const getUserWorkload = asyncHandler(async (req, res) => {
    const workload = await WorkloadBalancingService.calculateUserWorkload(req.params.userId);

    res.json({
        success: true,
        data: workload
    });
});

// @desc    Get team workload summary
// @route   GET /api/workload/team/summary
// @access  Private
const getTeamWorkloadSummary = asyncHandler(async (req, res) => {
    const { projectId } = req.query;

    const summary = await WorkloadBalancingService.getTeamWorkloadSummary(projectId);

    res.json({
        success: true,
        data: summary
    });
});

// @desc    Trigger automatic workload rebalancing
// @route   POST /api/workload/rebalance
// @access  Private/Admin
const triggerWorkloadRebalancing = asyncHandler(async (req, res) => {
    // Check if user is admin or project manager
    if (req.user.role !== 'admin' && req.user.role !== 'project_manager' && req.user.role !== 'technical_lead') {
        res.status(403);
        throw new Error('Not authorized to trigger workload rebalancing');
    }

    const { projectId } = req.body;

    const results = await WorkloadBalancingService.rebalanceTeamWorkload(projectId);

    // Emit socket event for real-time updates
    const io = req.app.get('io');
    if (io) {
        io.emit('workload:rebalanced', {
            ...results,
            timestamp: new Date(),
            triggeredBy: req.user.fullName
        });
    }

    res.json({
        success: true,
        message: `Rebalancing complete. ${results.rebalanced} tasks reassigned.`,
        data: results
    });
});

// @desc    Get list of team members with same skills
// @route   GET /api/workload/:userId/team-members
// @access  Private
const getTeamMembersWithSameSkills = asyncHandler(async (req, res) => {
    const teamMembers = await WorkloadBalancingService.findTeamMembersWithSameSkills(req.params.userId);

    // Include workload info for each team member
    const memberData = [];
    for (const member of teamMembers) {
        const workload = await WorkloadBalancingService.calculateUserWorkload(member._id);
        memberData.push({
            user: {
                id: member._id,
                name: member.fullName,
                email: member.email,
                skills: member.profileInfo?.skills || []
            },
            workload
        });
    }

    res.json({
        success: true,
        data: memberData.sort((a, b) => a.workload.workloadPercentage - b.workload.workloadPercentage)
    });
});

// @desc    Get tasks that can be reassigned for a user
// @route   GET /api/workload/:userId/reassignable-tasks
// @access  Private
const getReassignableTasks = asyncHandler(async (req, res) => {
    const tasks = await WorkloadBalancingService.getReassignableTasksForUser(req.params.userId);

    res.json({
        success: true,
        data: tasks,
        count: tasks.length
    });
});

// @desc    Manually reassign a specific task
// @route   POST /api/workload/reassign-task
// @access  Private/Admin
const manuallyReassignTask = asyncHandler(async (req, res) => {
    const { taskId, fromUserId, toUserId } = req.body;

    if (!taskId || !fromUserId || !toUserId) {
        res.status(400);
        throw new Error('Missing required fields: taskId, fromUserId, toUserId');
    }

    // Check authorization
    if (req.user.role !== 'admin' && req.user.role !== 'project_manager' && req.user.role !== 'technical_lead') {
        res.status(403);
        throw new Error('Not authorized to reassign tasks');
    }

    const Task = require('../models/Task');
    const User = require('../models/User');

    const task = await Task.findById(taskId);
    if (!task) {
        res.status(404);
        throw new Error('Task not found');
    }

    const toUser = await User.findById(toUserId);
    if (!toUser) {
        res.status(404);
        throw new Error('Target user not found');
    }

    // Perform reassignment
    const updatedTask = await Task.findByIdAndUpdate(
        taskId,
        {
            assignedTo: [toUserId],
            $push: {
                history: {
                    field: 'assignedTo',
                    oldValue: fromUserId,
                    newValue: toUserId,
                    updatedBy: req.user._id,
                    timestamp: new Date()
                }
            }
        },
        { new: true }
    ).populate('assignedTo', 'fullName email');

    res.json({
        success: true,
        message: `Task reassigned to ${toUser.fullName}`,
        data: updatedTask
    });
});

module.exports = {
    getUserWorkload,
    getTeamWorkloadSummary,
    triggerWorkloadRebalancing,
    getTeamMembersWithSameSkills,
    getReassignableTasks,
    manuallyReassignTask
};
