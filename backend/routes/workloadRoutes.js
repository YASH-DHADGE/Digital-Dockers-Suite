const express = require('express');
const router = express.Router();
const {
    getUserWorkload,
    getTeamWorkloadSummary,
    triggerWorkloadRebalancing,
    getTeamMembersWithSameSkills,
    getReassignableTasks,
    manuallyReassignTask
} = require('../controllers/workloadController');
const { protect } = require('../middlewares/authMiddleware');

/**
 * ============================================================================
 * WORKLOAD BALANCING ROUTES
 * ============================================================================
 */

// Get workload for a specific user
router.get('/:userId', protect, getUserWorkload);

// Get team members with same skills
router.get('/:userId/team-members', protect, getTeamMembersWithSameSkills);

// Get reassignable tasks for a user
router.get('/:userId/reassignable-tasks', protect, getReassignableTasks);

// Get team workload summary
router.get('/team/summary', protect, getTeamWorkloadSummary);

// Trigger automatic workload rebalancing (Admin/PM/Lead only)
router.post('/rebalance', protect, triggerWorkloadRebalancing);

// Manually reassign a task (Admin/PM/Lead only)
router.post('/reassign-task', protect, manuallyReassignTask);

module.exports = router;
