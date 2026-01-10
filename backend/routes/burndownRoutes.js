const express = require('express');
const router = express.Router();
const burndownService = require('../services/burndownService');
const { protect } = require('../middlewares/authMiddleware');

/**
 * Burndown Routes
 * Sprint burndown chart and burndown analytics endpoints
 */

// @desc    Get burndown data for a sprint
// @route   GET /api/sprints/:sprintId/burndown
// @access  Private
router.get('/:sprintId/burndown', protect, async (req, res) => {
  try {
    const { sprintId } = req.params;

    const burndownData = await burndownService.calculateBurndown(sprintId);

    res.status(200).json({
      success: true,
      data: burndownData
    });
  } catch (error) {
    console.error('Error fetching burndown:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to fetch burndown data'
    });
  }
});

// @desc    Get burndown history for a project
// @route   GET /api/projects/:projectId/burndown-history
// @access  Private
router.get('/project/:projectId/history', protect, async (req, res) => {
  try {
    const { projectId } = req.params;
    const { limit = 5 } = req.query;

    const history = await burndownService.getBurndownHistory(projectId, parseInt(limit));

    res.status(200).json({
      success: true,
      data: history
    });
  } catch (error) {
    console.error('Error fetching burndown history:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to fetch burndown history'
    });
  }
});

// @desc    Get team velocity metrics
// @route   GET /api/projects/:projectId/velocity
// @access  Private
router.get('/project/:projectId/velocity', protect, async (req, res) => {
  try {
    const { projectId } = req.params;
    const { sprintLimit = 5 } = req.query;

    const velocity = await burndownService.getTeamVelocity(projectId, parseInt(sprintLimit));

    res.status(200).json({
      success: true,
      data: velocity
    });
  } catch (error) {
    console.error('Error fetching team velocity:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to fetch team velocity'
    });
  }
});

module.exports = router;
