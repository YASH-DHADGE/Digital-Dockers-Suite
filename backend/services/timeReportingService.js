const WorkLog = require('../models/WorkLog');
const Task = require('../models/Task');
const mongoose = require('mongoose');

/**
 * Time Reporting Service
 * Generates reports and aggregations for work logs
 * Supports project, sprint, user, and ticket-level reporting
 */
const timeReportingService = {
  /**
   * Get time spent by user within date range
   */
  getUserTimeReport: async (userId, startDate, endDate) => {
    try {
      const logs = await WorkLog.getUserLogs(userId, startDate, endDate)
        .lean();

      const totalMinutes = logs.reduce((sum, log) => sum + (log.durationMinutes || 0), 0);
      const billableMinutes = logs
        .filter(log => log.billable)
        .reduce((sum, log) => sum + (log.durationMinutes || 0), 0);

      const byDay = {};
      logs.forEach(log => {
        const day = log.createdAt.toISOString().split('T')[0];
        if (!byDay[day]) {
          byDay[day] = { totalMinutes: 0, logCount: 0, logs: [] };
        }
        byDay[day].totalMinutes += log.durationMinutes;
        byDay[day].logCount++;
        byDay[day].logs.push(log);
      });

      return {
        success: true,
        data: {
          userId,
          startDate,
          endDate,
          totalMinutes,
          totalHours: Math.round((totalMinutes / 60) * 10) / 10,
          billableMinutes,
          billableHours: Math.round((billableMinutes / 60) * 10) / 10,
          logCount: logs.length,
          averagePerDay: Math.round(totalMinutes / ((endDate - startDate) / (1000 * 60 * 60 * 24))),
          byDay,
          logs
        }
      };
    } catch (error) {
      throw new Error(`Failed to generate user report: ${error.message}`);
    }
  },

  /**
   * Get time report for a project
   */
  getProjectTimeReport: async (projectId, startDate, endDate, options = {}) => {
    try {
      // Find all work items in project
      const workItems = await Task.find({
        project: projectId,
        issueType: { $ne: 'subtask' }
      }).select('_id title issueKey');

      const workItemIds = workItems.map(wi => wi._id);

      // Get logs for all work items
      const logs = await WorkLog.find({
        workItemId: { $in: workItemIds },
        createdAt: {
          $gte: startDate,
          $lte: endDate
        },
        status: { $in: ['STOPPED', 'FINALIZED', 'APPROVED'] }
      }).populate('userId', 'name email')
        .populate('workItemId', 'title issueKey')
        .lean();

      const totalMinutes = logs.reduce((sum, log) => sum + (log.durationMinutes || 0), 0);
      const billableMinutes = logs
        .filter(log => log.billable)
        .reduce((sum, log) => sum + (log.durationMinutes || 0), 0);

      // Aggregate by user
      const byUser = {};
      logs.forEach(log => {
        const userId = log.userId._id.toString();
        if (!byUser[userId]) {
          byUser[userId] = {
            userId: log.userId._id,
            userName: log.userId.name,
            userEmail: log.userId.email,
            totalMinutes: 0,
            billableMinutes: 0,
            logCount: 0
          };
        }
        byUser[userId].totalMinutes += log.durationMinutes;
        if (log.billable) {
          byUser[userId].billableMinutes += log.durationMinutes;
        }
        byUser[userId].logCount++;
      });

      // Aggregate by work item (ticket)
      const byTicket = {};
      logs.forEach(log => {
        const ticketId = log.workItemId._id.toString();
        if (!byTicket[ticketId]) {
          byTicket[ticketId] = {
            ticketId: log.workItemId._id,
            issueKey: log.workItemId.issueKey,
            title: log.workItemId.title,
            totalMinutes: 0,
            logCount: 0
          };
        }
        byTicket[ticketId].totalMinutes += log.durationMinutes;
        byTicket[ticketId].logCount++;
      });

      // Top tickets by time spent
      const topTickets = Object.values(byTicket)
        .sort((a, b) => b.totalMinutes - a.totalMinutes)
        .slice(0, options.topCount || 10);

      // Top users by time spent
      const topUsers = Object.values(byUser)
        .sort((a, b) => b.totalMinutes - a.totalMinutes)
        .slice(0, options.topCount || 10);

      return {
        success: true,
        data: {
          projectId,
          startDate,
          endDate,
          totalMinutes,
          totalHours: Math.round((totalMinutes / 60) * 10) / 10,
          billableMinutes,
          billableHours: Math.round((billableMinutes / 60) * 10) / 10,
          logCount: logs.length,
          userCount: Object.keys(byUser).length,
          ticketCount: workItems.length,
          averagePerTicket: workItems.length > 0 ? Math.round(totalMinutes / workItems.length) : 0,
          topUsers,
          topTickets,
          allUsers: Object.values(byUser),
          allTickets: Object.values(byTicket)
        }
      };
    } catch (error) {
      throw new Error(`Failed to generate project report: ${error.message}`);
    }
  },

  /**
   * Get time report for a sprint
   */
  getSprintTimeReport: async (sprintId, options = {}) => {
    try {
      // Find all work items in sprint
      const workItems = await Task.find({
        sprint: sprintId,
        issueType: { $ne: 'subtask' }
      }).select('_id title issueKey status');

      const workItemIds = workItems.map(wi => wi._id);

      // Get logs for all work items
      const logs = await WorkLog.find({
        workItemId: { $in: workItemIds },
        status: { $in: ['STOPPED', 'FINALIZED', 'APPROVED'] }
      }).populate('userId', 'name email')
        .populate('workItemId', 'title issueKey status')
        .lean();

      const totalMinutes = logs.reduce((sum, log) => sum + (log.durationMinutes || 0), 0);
      const billableMinutes = logs
        .filter(log => log.billable)
        .reduce((sum, log) => sum + (log.durationMinutes || 0), 0);

      // Aggregate by status
      const byStatus = {};
      ['todo', 'in_progress', 'in_review', 'done'].forEach(status => {
        byStatus[status] = { status, totalMinutes: 0, logCount: 0 };
      });

      logs.forEach(log => {
        const status = log.workItemId.status || 'todo';
        if (byStatus[status]) {
          byStatus[status].totalMinutes += log.durationMinutes;
          byStatus[status].logCount++;
        }
      });

      // Aggregate by user
      const byUser = {};
      logs.forEach(log => {
        const userId = log.userId._id.toString();
        if (!byUser[userId]) {
          byUser[userId] = {
            userId: log.userId._id,
            userName: log.userId.name,
            userEmail: log.userId.email,
            totalMinutes: 0,
            logCount: 0
          };
        }
        byUser[userId].totalMinutes += log.durationMinutes;
        byUser[userId].logCount++;
      });

      return {
        success: true,
        data: {
          sprintId,
          totalMinutes,
          totalHours: Math.round((totalMinutes / 60) * 10) / 10,
          billableMinutes,
          billableHours: Math.round((billableMinutes / 60) * 10) / 10,
          logCount: logs.length,
          ticketCount: workItems.length,
          userCount: Object.keys(byUser).length,
          byStatus: Object.values(byStatus),
          byUser: Object.values(byUser),
          averagePerTicket: workItems.length > 0 ? Math.round(totalMinutes / workItems.length) : 0,
          averagePerUser: Object.keys(byUser).length > 0 
            ? Math.round(totalMinutes / Object.keys(byUser).length) 
            : 0
        }
      };
    } catch (error) {
      throw new Error(`Failed to generate sprint report: ${error.message}`);
    }
  },

  /**
   * Get time report for parent task (includes subtasks)
   */
  getParentTaskTimeReport: async (parentId) => {
    try {
      const parent = await Task.findById(parentId);
      if (!parent) {
        throw new Error('Parent task not found');
      }

      // Get children
      const children = await Task.find({ parentTask: parentId });
      const allTaskIds = [parentId, ...children.map(c => c._id)];

      // Get logs
      const logs = await WorkLog.find({
        workItemId: { $in: allTaskIds },
        status: { $in: ['STOPPED', 'FINALIZED', 'APPROVED'] }
      }).populate('userId', 'name email')
        .lean();

      const totalMinutes = logs.reduce((sum, log) => sum + (log.durationMinutes || 0), 0);

      // Breakdown: parent vs children
      const parentLogs = logs.filter(log => log.workItemId.toString() === parentId.toString());
      const childrenLogs = logs.filter(log => log.workItemId.toString() !== parentId.toString());

      const parentMinutes = parentLogs.reduce((sum, log) => sum + (log.durationMinutes || 0), 0);
      const childrenMinutes = childrenLogs.reduce((sum, log) => sum + (log.durationMinutes || 0), 0);

      return {
        success: true,
        data: {
          parentId,
          parentTitle: parent.title,
          parentKey: parent.issueKey,
          totalMinutes,
          totalHours: Math.round((totalMinutes / 60) * 10) / 10,
          parentMinutes,
          parentHours: Math.round((parentMinutes / 60) * 10) / 10,
          childrenMinutes,
          childrenHours: Math.round((childrenMinutes / 60) * 10) / 10,
          childrenCount: children.length,
          logCount: logs.length,
          childrenTasksWithTime: children
            .map(child => {
              const childLogs = logs.filter(log => log.workItemId.toString() === child._id.toString());
              const childMinutes = childLogs.reduce((sum, log) => sum + (log.durationMinutes || 0), 0);
              return {
                taskId: child._id,
                title: child.title,
                issueKey: child.issueKey,
                totalMinutes: childMinutes,
                totalHours: Math.round((childMinutes / 60) * 10) / 10,
                logCount: childLogs.length
              };
            })
            .filter(t => t.totalMinutes > 0)
            .sort((a, b) => b.totalMinutes - a.totalMinutes)
        }
      };
    } catch (error) {
      throw new Error(`Failed to generate parent task report: ${error.message}`);
    }
  },

  /**
   * Get summary dashboard data
   */
  getDashboardSummary: async (projectId, days = 7) => {
    try {
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);
      const endDate = new Date();

      // Find all work items in project
      const workItems = await Task.find({ project: projectId }).select('_id');
      const workItemIds = workItems.map(wi => wi._id);

      // Get logs for the period
      const logs = await WorkLog.find({
        workItemId: { $in: workItemIds },
        createdAt: {
          $gte: startDate,
          $lte: endDate
        },
        status: { $in: ['STOPPED', 'FINALIZED', 'APPROVED'] }
      }).populate('userId', 'name').lean();

      // Calculate daily totals
      const dailyTotals = {};
      for (let i = 0; i < days; i++) {
        const day = new Date(startDate);
        day.setDate(day.getDate() + i);
        const dayKey = day.toISOString().split('T')[0];
        dailyTotals[dayKey] = 0;
      }

      logs.forEach(log => {
        const dayKey = log.createdAt.toISOString().split('T')[0];
        if (dailyTotals.hasOwnProperty(dayKey)) {
          dailyTotals[dayKey] += log.durationMinutes;
        }
      });

      // Top users
      const userTotals = {};
      logs.forEach(log => {
        const userId = log.userId._id.toString();
        if (!userTotals[userId]) {
          userTotals[userId] = {
            userId: log.userId._id,
            userName: log.userId.name,
            totalMinutes: 0
          };
        }
        userTotals[userId].totalMinutes += log.durationMinutes;
      });

      const topUsers = Object.values(userTotals)
        .sort((a, b) => b.totalMinutes - a.totalMinutes)
        .slice(0, 5);

      const totalMinutes = Object.values(dailyTotals).reduce((sum, val) => sum + val, 0);

      return {
        success: true,
        data: {
          period: { startDate, endDate, days },
          totalMinutes,
          totalHours: Math.round((totalMinutes / 60) * 10) / 10,
          logCount: logs.length,
          averagePerDay: Math.round(totalMinutes / days),
          dailyTotals,
          topUsers,
          trend: totalMinutes > 0 ? 'active' : 'inactive'
        }
      };
    } catch (error) {
      throw new Error(`Failed to get dashboard summary: ${error.message}`);
    }
  }
};

module.exports = timeReportingService;
