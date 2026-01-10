const workLogService = require('../services/workLogService');
const timeReportingService = require('../services/timeReportingService');
const WorkLog = require('../models/WorkLog');

/**
 * Work Log Controller
 * Handles HTTP requests for work logging
 */
const workLogController = {
  /**
   * POST /work-items/:id/work-logs/start
   * Start a timer on a work item
   */
  startTimer: async (req, res) => {
    try {
      const { id: workItemId } = req.params;
      const userId = req.user.id;
      const { description } = req.body;

      const result = await workLogService.startTimer(workItemId, userId, description);
      
      res.status(200).json(result);
    } catch (error) {
      res.status(400).json({
        success: false,
        error: error.message
      });
    }
  },

  /**
   * POST /work-items/:id/work-logs/stop
   * Stop a running timer
   */
  stopTimer: async (req, res) => {
    try {
      const { id: workItemId } = req.params;
      const userId = req.user.id;

      const result = await workLogService.stopTimer(workItemId, userId);
      
      res.status(200).json(result);
    } catch (error) {
      res.status(400).json({
        success: false,
        error: error.message
      });
    }
  },

  /**
   * POST /work-items/:id/work-logs
   * Create a manual work log entry
   */
  createManualLog: async (req, res) => {
    try {
      const { id: workItemId } = req.params;
      const userId = req.user.id;
      const {
        startTime,
        endTime,
        description,
        billable,
        roundingRule,
        tags
      } = req.body;

      // Validate required fields
      if (!startTime || !endTime) {
        return res.status(400).json({
          success: false,
          error: 'startTime and endTime are required'
        });
      }

      const result = await workLogService.createManualLog(
        workItemId,
        userId,
        startTime,
        endTime,
        description,
        { billable, roundingRule, tags }
      );

      res.status(201).json(result);
    } catch (error) {
      res.status(400).json({
        success: false,
        error: error.message
      });
    }
  },

  /**
   * GET /work-items/:id/work-logs
   * Get all work logs for a work item
   */
  getWorkLogs: async (req, res) => {
    try {
      const { id: workItemId } = req.params;
      const { userId, status, logType, dateFrom, dateTo } = req.query;

      const result = await workLogService.getWorkLogs(workItemId, {
        userId,
        status,
        logType,
        dateFrom,
        dateTo
      });

      res.status(200).json(result);
    } catch (error) {
      res.status(400).json({
        success: false,
        error: error.message
      });
    }
  },

  /**
   * GET /work-logs/:id
   * Get a specific work log
   */
  getWorkLog: async (req, res) => {
    try {
      const { id: workLogId } = req.params;

      const workLog = await WorkLog.findById(workLogId)
        .populate('userId', 'name email avatar')
        .populate('approvedBy', 'name')
        .populate('workItemId', 'title issueKey');

      if (!workLog) {
        return res.status(404).json({
          success: false,
          error: 'Work log not found'
        });
      }

      res.status(200).json({
        success: true,
        data: workLog
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        error: error.message
      });
    }
  },

  /**
   * PATCH /work-logs/:id
   * Update a work log
   */
  updateWorkLog: async (req, res) => {
    try {
      const { id: workLogId } = req.params;
      const userId = req.user.id;
      const { description, durationMinutes, tags, billable, reason } = req.body;

      const result = await workLogService.updateWorkLog(workLogId, userId, {
        description,
        durationMinutes,
        tags,
        billable,
        reason
      });

      res.status(200).json(result);
    } catch (error) {
      res.status(400).json({
        success: false,
        error: error.message
      });
    }
  },

  /**
   * DELETE /work-logs/:id
   * Delete a work log
   */
  deleteWorkLog: async (req, res) => {
    try {
      const { id: workLogId } = req.params;

      const result = await workLogService.deleteWorkLog(workLogId);

      res.status(200).json(result);
    } catch (error) {
      res.status(400).json({
        success: false,
        error: error.message
      });
    }
  },

  /**
   * GET /users/me/timer
   * Get running timer for current user
   */
  getRunningTimer: async (req, res) => {
    try {
      const userId = req.user.id;

      const result = await workLogService.getRunningTimer(userId);

      res.status(200).json(result);
    } catch (error) {
      res.status(400).json({
        success: false,
        error: error.message
      });
    }
  },

  /**
   * POST /users/me/timers/stop
   * Stop all running timers for current user
   */
  stopUserTimers: async (req, res) => {
    try {
      const userId = req.user.id;

      const result = await workLogService.stopUserTimers(userId);

      res.status(200).json(result);
    } catch (error) {
      res.status(400).json({
        success: false,
        error: error.message
      });
    }
  },

  /**
   * GET /work-items/:id/time-summary
   * Get time summary for a work item
   */
  getTimeSummary: async (req, res) => {
    try {
      const { id: workItemId } = req.params;

      const result = await workLogService.getTimeSummary(workItemId);

      res.status(200).json(result);
    } catch (error) {
      res.status(400).json({
        success: false,
        error: error.message
      });
    }
  },

  /**
   * POST /work-logs/:id/approve
   * Approve a work log (admin only)
   */
  approveWorkLog: async (req, res) => {
    try {
      const { id: workLogId } = req.params;
      const approverId = req.user.id;
      const { notes } = req.body;

      // Check if user is admin/manager
      if (!['admin', 'manager'].includes(req.user.role)) {
        return res.status(403).json({
          success: false,
          error: 'Permission denied'
        });
      }

      const result = await workLogService.approveWorkLog(workLogId, approverId, notes);

      res.status(200).json(result);
    } catch (error) {
      res.status(400).json({
        success: false,
        error: error.message
      });
    }
  },

  /**
   * GET /reports/time
   * Get time report
   */
  getTimeReport: async (req, res) => {
    try {
      const { type = 'user', userId, projectId, sprintId, startDate, endDate, days } = req.query;

      let result;

      if (type === 'user') {
        const uid = userId || req.user.id;
        const start = startDate ? new Date(startDate) : new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
        const end = endDate ? new Date(endDate) : new Date();
        
        result = await timeReportingService.getUserTimeReport(uid, start, end);
      } else if (type === 'project' && projectId) {
        const start = startDate ? new Date(startDate) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
        const end = endDate ? new Date(endDate) : new Date();
        
        result = await timeReportingService.getProjectTimeReport(projectId, start, end);
      } else if (type === 'sprint' && sprintId) {
        result = await timeReportingService.getSprintTimeReport(sprintId);
      } else if (type === 'parent' && userId) {
        result = await timeReportingService.getParentTaskTimeReport(userId);
      } else if (type === 'dashboard' && projectId) {
        const periodDays = parseInt(days) || 7;
        result = await timeReportingService.getDashboardSummary(projectId, periodDays);
      } else {
        return res.status(400).json({
          success: false,
          error: 'Invalid report type or missing parameters'
        });
      }

      res.status(200).json(result);
    } catch (error) {
      res.status(400).json({
        success: false,
        error: error.message
      });
    }
  }
};

module.exports = workLogController;
