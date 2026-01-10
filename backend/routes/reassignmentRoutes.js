const express = require('express');
const router = express.Router();
const {
    getReassignmentRecommendation,
    executeReassignment,
    getTeamWorkloadAnalysis,
    batchAnalyzeForReassignment
} = require('../controllers/reassignmentController');
const { protect } = require('../middlewares/authMiddleware');

/**
 * ============================================================================
 * SMART REASSIGNMENT ASSISTANT ROUTES
 * ============================================================================
 */

// Get team workload analysis (must be BEFORE /:taskId routes)
router.get('/team/analysis', protect, getTeamWorkloadAnalysis);

// Batch analyze all tasks in sprint (manager/lead only)
router.post('/batch-analyze', protect, batchAnalyzeForReassignment);

// Get recommendation for a specific task
router.get('/:taskId/recommend', protect, getReassignmentRecommendation);

// Execute reassignment (manager/lead only)
router.post('/:taskId/execute', protect, executeReassignment);

module.exports = router;
