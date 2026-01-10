const express = require('express');
const workLogController = require('../controllers/workLogController');
const { protect } = require('../middlewares/authMiddleware');
const { role } = require('../middlewares/roleMiddleware');

const router = express.Router();

/**
 * Work Log Routes
 * All routes require authentication
 */

// Timer endpoints
router.post('/:id/work-logs/start', protect, workLogController.startTimer);
router.post('/:id/work-logs/stop', protect, workLogController.stopTimer);

// Manual log endpoints
router.post('/:id/work-logs', protect, workLogController.createManualLog);
router.get('/:id/work-logs', protect, workLogController.getWorkLogs);

// Work log CRUD
router.get('/logs/:id', protect, workLogController.getWorkLog);
router.patch('/logs/:id', protect, workLogController.updateWorkLog);
router.delete('/logs/:id', protect, workLogController.deleteWorkLog);

// Get running timer for current user
router.get('/users/me/timer', protect, workLogController.getRunningTimer);

// Stop all timers for current user
router.post('/users/me/timers/stop', protect, workLogController.stopUserTimers);

// Time summary for work item
router.get('/:id/time-summary', protect, workLogController.getTimeSummary);

// Approval endpoint (admin only)
router.post('/logs/:id/approve', protect, role('admin', 'manager'), workLogController.approveWorkLog);

// Reporting endpoint
router.get('/reports/time', protect, workLogController.getTimeReport);

module.exports = router;
