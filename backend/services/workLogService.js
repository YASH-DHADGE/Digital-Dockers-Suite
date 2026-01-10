const WorkLog = require('../models/WorkLog');
const Task = require('../models/Task');
const mongoose = require('mongoose');

/**
 * Work Log Service
 * Handles all work logging business logic
 * Includes timer management, validation, and reporting
 */
const workLogService = {
  /**
   * Start a new timer for a user on a work item
   * Stops any existing running timer
   */
  startTimer: async (workItemId, userId, description = '') => {
    try {
      // Verify work item exists
      const workItem = await Task.findById(workItemId);
      if (!workItem) {
        throw new Error('Work item not found');
      }

      // Stop any existing running timer for this user
      const existingTimer = await WorkLog.getRunningTimer(userId);
      if (existingTimer) {
        await existingTimer.stopTimer();
      }

      // Create new timer log
      const workLog = new WorkLog({
        workItemId,
        userId,
        startTime: new Date(),
        endTime: null,
        description,
        logType: 'TIMER',
        isTemporary: true,
        status: 'RUNNING',
        durationMinutes: 0
      });

      await workLog.save();

      return {
        success: true,
        data: workLog.toDisplay(),
        message: 'Timer started'
      };
    } catch (error) {
      throw new Error(`Failed to start timer: ${error.message}`);
    }
  },

  /**
   * Stop a running timer and save the work log
   */
  stopTimer: async (workItemId, userId) => {
    try {
      const workLog = await WorkLog.findOne({
        workItemId,
        userId,
        isTemporary: true,
        status: 'RUNNING'
      });

      if (!workLog) {
        throw new Error('No running timer found for this user on this work item');
      }

      await workLog.stopTimer();

      return {
        success: true,
        data: workLog.toDisplay(),
        message: 'Timer stopped and logged'
      };
    } catch (error) {
      throw new Error(`Failed to stop timer: ${error.message}`);
    }
  },

  /**
   * Create a manual work log entry
   */
  createManualLog: async (workItemId, userId, startTime, endTime, description, options = {}) => {
    try {
      // Verify work item exists
      const workItem = await Task.findById(workItemId);
      if (!workItem) {
        throw new Error('Work item not found');
      }

      // Validate times
      const start = new Date(startTime);
      const end = new Date(endTime);

      if (start >= end) {
        throw new Error('End time must be after start time');
      }

      // Calculate duration
      const durationMs = end - start;
      const durationMinutes = Math.floor(durationMs / 60000);

      // Validate max duration (12 hours)
      if (durationMinutes > 12 * 60) {
        throw new Error('Work log duration cannot exceed 12 hours');
      }

      // Check for overlaps
      const overlap = await WorkLog.findOne({
        userId,
        startTime: { $lt: end },
        endTime: { $exists: true, $gt: start },
        status: { $in: ['STOPPED', 'FINALIZED', 'APPROVED'] }
      });

      if (overlap) {
        throw new Error('This time overlaps with an existing work log');
      }

      // Apply rounding rule if specified
      let finalDuration = durationMinutes;
      if (options.roundingRule && options.roundingRule !== 'NONE') {
        const rules = {
          'ROUND_5': 5,
          'ROUND_15': 15,
          'ROUND_30': 30
        };
        const roundTo = rules[options.roundingRule];
        if (roundTo) {
          finalDuration = Math.ceil(durationMinutes / roundTo) * roundTo;
        }
      }

      // Create work log
      const workLog = new WorkLog({
        workItemId,
        userId,
        startTime: start,
        endTime: end,
        durationMinutes: finalDuration,
        description,
        logType: 'MANUAL',
        isTemporary: false,
        status: 'STOPPED',
        billable: options.billable ?? true,
        tags: options.tags || [],
        roundingRule: options.roundingRule || 'NONE'
      });

      await workLog.save();

      // Update task total time
      await workLogService.updateTaskTotalTime(workItemId);

      return {
        success: true,
        data: workLog.toDisplay(),
        message: 'Manual work log created'
      };
    } catch (error) {
      throw new Error(`Failed to create manual log: ${error.message}`);
    }
  },

  /**
   * Update a work log entry
   * Records edit in audit trail
   */
  updateWorkLog: async (workLogId, userId, updates) => {
    try {
      const workLog = await WorkLog.findById(workLogId);
      if (!workLog) {
        throw new Error('Work log not found');
      }

      // Cannot edit approved logs
      if (workLog.status === 'APPROVED') {
        throw new Error('Cannot edit an approved work log');
      }

      // Record previous values for audit trail
      const previousDuration = workLog.durationMinutes;
      const previousDescription = workLog.description;

      // Update fields
      if (updates.description !== undefined) {
        workLog.description = updates.description;
      }

      if (updates.durationMinutes !== undefined) {
        if (updates.durationMinutes > 12 * 60) {
          throw new Error('Duration cannot exceed 12 hours');
        }
        workLog.durationMinutes = updates.durationMinutes;
      }

      if (updates.tags !== undefined) {
        workLog.tags = updates.tags;
      }

      if (updates.billable !== undefined) {
        workLog.billable = updates.billable;
      }

      // Record edit in audit trail
      await workLog.recordEdit(userId, previousDuration, previousDescription, updates.reason);

      // Update task total time
      await workLogService.updateTaskTotalTime(workLog.workItemId);

      return {
        success: true,
        data: workLog.toDisplay(),
        message: 'Work log updated'
      };
    } catch (error) {
      throw new Error(`Failed to update work log: ${error.message}`);
    }
  },

  /**
   * Delete a work log
   * Only temporary/non-finalized logs can be deleted
   */
  deleteWorkLog: async (workLogId) => {
    try {
      const workLog = await WorkLog.findById(workLogId);
      if (!workLog) {
        throw new Error('Work log not found');
      }

      // Cannot delete finalized/approved logs
      if (['FINALIZED', 'APPROVED'].includes(workLog.status)) {
        throw new Error('Cannot delete a finalized or approved work log');
      }

      const workItemId = workLog.workItemId;
      await WorkLog.deleteOne({ _id: workLogId });

      // Update task total time
      await workLogService.updateTaskTotalTime(workItemId);

      return {
        success: true,
        message: 'Work log deleted'
      };
    } catch (error) {
      throw new Error(`Failed to delete work log: ${error.message}`);
    }
  },

  /**
   * Get all work logs for a work item
   */
  getWorkLogs: async (workItemId, filter = {}) => {
    try {
      const query = { workItemId };

      // Apply filters
      if (filter.userId) {
        query.userId = filter.userId;
      }

      if (filter.status) {
        query.status = filter.status;
      }

      if (filter.logType) {
        query.logType = filter.logType;
      }

      if (filter.dateFrom || filter.dateTo) {
        query.createdAt = {};
        if (filter.dateFrom) {
          query.createdAt.$gte = new Date(filter.dateFrom);
        }
        if (filter.dateTo) {
          query.createdAt.$lte = new Date(filter.dateTo);
        }
      }

      const workLogs = await WorkLog.find(query)
        .populate('userId', 'name email avatar')
        .populate('approvedBy', 'name')
        .sort({ createdAt: -1 });

      return {
        success: true,
        data: workLogs,
        count: workLogs.length
      };
    } catch (error) {
      throw new Error(`Failed to fetch work logs: ${error.message}`);
    }
  },

  /**
   * Get running timer for user
   */
  getRunningTimer: async (userId) => {
    try {
      const timer = await WorkLog.findOne({
        userId,
        isTemporary: true,
        status: 'RUNNING'
      }).populate('workItemId', 'title issueKey');

      if (!timer) {
        return {
          success: true,
          data: null,
          message: 'No running timer'
        };
      }

      return {
        success: true,
        data: timer.toDisplay()
      };
    } catch (error) {
      throw new Error(`Failed to get running timer: ${error.message}`);
    }
  },

  /**
   * Stop all running timers for a user
   * Used when user logs out
   */
  stopUserTimers: async (userId) => {
    try {
      const stoppedLogs = await WorkLog.stopUserTimers(userId);

      return {
        success: true,
        data: stoppedLogs.map(log => log.toDisplay()),
        count: stoppedLogs.length,
        message: `Stopped ${stoppedLogs.length} timer(s)`
      };
    } catch (error) {
      throw new Error(`Failed to stop user timers: ${error.message}`);
    }
  },

  /**
   * Auto-stop timer when ticket moves to Done
   */
  autoStopOnCompletion: async (workItemId) => {
    try {
      const runningLogs = await WorkLog.find({
        workItemId,
        isTemporary: true,
        status: 'RUNNING'
      });

      const stoppedLogs = [];
      for (const log of runningLogs) {
        await log.stopTimer();
        stoppedLogs.push(log);
      }

      return stoppedLogs;
    } catch (error) {
      throw new Error(`Failed to auto-stop timers: ${error.message}`);
    }
  },

  /**
   * Approve a work log (enterprise feature)
   */
  approveWorkLog: async (workLogId, approverId, notes = '') => {
    try {
      const workLog = await WorkLog.findById(workLogId);
      if (!workLog) {
        throw new Error('Work log not found');
      }

      await workLog.approve(approverId, notes);

      return {
        success: true,
        data: workLog.toDisplay(),
        message: 'Work log approved'
      };
    } catch (error) {
      throw new Error(`Failed to approve work log: ${error.message}`);
    }
  },

  /**
   * Update task total time spent
   * Called after any work log change
   */
  updateTaskTotalTime: async (workItemId) => {
    try {
      const result = await WorkLog.getTotalTime(workItemId);
      const totalMinutes = result[0]?.totalMinutes || 0;

      await Task.findByIdAndUpdate(workItemId, {
        totalTimeSpent: totalMinutes,
        timeSpentHours: Math.round((totalMinutes / 60) * 10) / 10 // Round to 1 decimal
      });

      return totalMinutes;
    } catch (error) {
      console.error('Failed to update task total time:', error);
      // Don't throw - this is non-critical
    }
  },

  /**
   * Get time summary for a work item
   */
  getTimeSummary: async (workItemId) => {
    try {
      const workItem = await Task.findById(workItemId);
      const logs = await WorkLog.find({
        workItemId,
        status: { $in: ['STOPPED', 'FINALIZED', 'APPROVED'] }
      }).populate('userId', 'name email');

      const totalMinutes = logs.reduce((sum, log) => sum + (log.durationMinutes || 0), 0);
      const billableMinutes = logs
        .filter(log => log.billable)
        .reduce((sum, log) => sum + (log.durationMinutes || 0), 0);

      // Group by user
      const byUser = {};
      logs.forEach(log => {
        const userId = log.userId._id.toString();
        if (!byUser[userId]) {
          byUser[userId] = {
            userId: log.userId._id,
            userName: log.userId.name,
            userEmail: log.userId.email,
            totalMinutes: 0,
            logCount: 0,
            logs: []
          };
        }
        byUser[userId].totalMinutes += log.durationMinutes;
        byUser[userId].logCount++;
        byUser[userId].logs.push(log);
      });

      return {
        success: true,
        data: {
          workItemId,
          issueKey: workItem?.issueKey,
          title: workItem?.title,
          totalMinutes,
          totalHours: Math.round((totalMinutes / 60) * 10) / 10,
          billableMinutes,
          billableHours: Math.round((billableMinutes / 60) * 10) / 10,
          logCount: logs.length,
          byUser: Object.values(byUser),
          averagePerLog: logs.length > 0 ? Math.round(totalMinutes / logs.length) : 0
        }
      };
    } catch (error) {
      throw new Error(`Failed to get time summary: ${error.message}`);
    }
  },

  /**
   * Clean up orphaned temporary logs
   * Runs as background job
   */
  cleanupOrphanedLogs: async (maxAgeHours = 24) => {
    try {
      const cutoffTime = new Date(Date.now() - maxAgeHours * 60 * 60 * 1000);

      const result = await WorkLog.deleteMany({
        isTemporary: true,
        createdAt: { $lt: cutoffTime }
      });

      console.log(`Cleaned up ${result.deletedCount} orphaned work logs`);
      return result.deletedCount;
    } catch (error) {
      console.error('Failed to cleanup orphaned logs:', error);
    }
  }
};

module.exports = workLogService;
