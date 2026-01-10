const Task = require('../models/Task');
const Sprint = require('../models/Sprint');

/**
 * Burndown Service
 * Calculates sprint burndown data for charts and progress tracking
 * Includes ideal burndown calculation and actual remaining work
 */
const burndownService = {
  /**
   * Calculate burndown data for a sprint
   * Returns daily breakdown of story points remaining
   */
  calculateBurndown: async (sprintId) => {
    try {
      const sprint = await Sprint.findById(sprintId);
      
      if (!sprint) {
        throw new Error('Sprint not found');
      }

      const startDate = new Date(sprint.startDate);
      const endDate = new Date(sprint.endDate);
      const sprintDays = Math.ceil((endDate - startDate) / (1000 * 60 * 60 * 24)) || 1;

      // Get all tasks in sprint (including subtasks)
      const tasks = await Task.find({
        sprint: sprintId,
        issueType: { $ne: 'subtask' } // Don't double-count subtasks
      });

      // Get all subtasks for parents in this sprint
      const parentIds = tasks.map(t => t._id);
      const subtasks = await Task.find({
        parentTask: { $in: parentIds }
      });

      // Combine for total story points
      const allTasks = [...tasks, ...subtasks];
      const committedPoints = sprint.committedPoints || allTasks.reduce((sum, t) => sum + (t.storyPoints || 0), 0);

      // Generate ideal burndown line (linear decrease)
      const idealBurndown = Array.from({ length: sprintDays + 1 }, (_, i) => {
        const percentComplete = i / sprintDays;
        return Math.round(committedPoints * (1 - percentComplete));
      });

      // Calculate actual remaining points for each day
      const actualBurndown = [];
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      for (let day = 0; day <= sprintDays; day++) {
        const dayDate = new Date(startDate);
        dayDate.setDate(dayDate.getDate() + day);
        dayDate.setHours(23, 59, 59, 999);

        // Find tasks completed by this day
        const completedByDay = allTasks.filter(task => {
          if (task.status !== 'done') return false;
          if (!task.updatedAt) return false;
          return new Date(task.updatedAt) <= dayDate;
        });

        const completedPoints = completedByDay.reduce((sum, t) => sum + (t.storyPoints || 0), 0);
        const remaining = Math.max(0, committedPoints - completedPoints);
        actualBurndown.push(remaining);
      }

      // Generate daily labels
      const labels = Array.from({ length: sprintDays + 1 }, (_, i) => {
        const date = new Date(startDate);
        date.setDate(date.getDate() + i);
        return `Day ${i + 1} (${date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })})`;
      });

      // Calculate current status
      const currentRemaining = allTasks
        .filter(t => t.status !== 'done')
        .reduce((sum, t) => sum + (t.storyPoints || 0), 0);

      const doneCount = allTasks.filter(t => t.status === 'done').length;
      const totalCount = allTasks.length;
      const completionPercentage = totalCount > 0 ? Math.round((doneCount / totalCount) * 100) : 0;

      // Check if on track
      const currentDay = Math.max(0, Math.min(
        sprintDays,
        Math.floor((today - startDate) / (1000 * 60 * 60 * 24))
      ));
      const idealRemaining = currentDay < idealBurndown.length ? idealBurndown[currentDay] : 0;
      const isOnTrack = currentRemaining <= idealRemaining * 1.1; // 10% tolerance

      return {
        sprintId,
        sprintName: sprint.name,
        labels,
        ideal: idealBurndown,
        actual: actualBurndown,
        committedPoints,
        currentRemaining,
        currentDay,
        sprintDays,
        completionPercentage,
        doneCount,
        totalCount,
        isOnTrack,
        health: isOnTrack ? 'healthy' : 'at-risk',
        trend: burndownService.calculateTrend(actualBurndown),
        forecast: burndownService.calculateForecast(actualBurndown, committedPoints, sprintDays)
      };
    } catch (error) {
      console.error('Error calculating burndown:', error);
      throw error;
    }
  },

  /**
   * Calculate trend - is velocity increasing/decreasing/stable
   */
  calculateTrend: (burndownArray) => {
    if (burndownArray.length < 3) return 'insufficient-data';

    const recentDays = burndownArray.slice(-5);
    const olderDays = burndownArray.slice(-10, -5);

    if (olderDays.length === 0) return 'insufficient-data';

    const recentAvg = recentDays.reduce((a, b) => a + b, 0) / recentDays.length;
    const olderAvg = olderDays.reduce((a, b) => a + b, 0) / olderDays.length;
    const change = ((recentAvg - olderAvg) / olderAvg) * 100;

    if (change > 10) return 'worsening'; // More points remaining = bad
    if (change < -10) return 'improving'; // Fewer points remaining = good
    return 'stable';
  },

  /**
   * Forecast when sprint will complete based on current velocity
   */
  calculateForecast: (burndownArray, committedPoints, totalSprintDays) => {
    if (burndownArray.length < 2) return null;

    const recentBurndown = burndownArray.slice(-7);
    let totalBurned = 0;
    let dayCount = 0;

    for (let i = 1; i < recentBurndown.length; i++) {
      const daysBurned = recentBurndown[i - 1] - recentBurndown[i];
      if (daysBurned > 0) {
        totalBurned += daysBurned;
        dayCount++;
      }
    }

    if (dayCount === 0) return null;

    const avgBurnPerDay = totalBurned / dayCount;
    const currentRemaining = recentBurndown[recentBurndown.length - 1];
    const daysNeeded = Math.ceil(currentRemaining / avgBurnPerDay);
    const currentDay = recentBurndown.length - 1;
    const forecastComplete = currentDay + daysNeeded;

    return {
      avgBurnPerDay: Math.round(avgBurnPerDay * 10) / 10,
      daysNeeded,
      forecastCompleteDay: forecastComplete,
      willCompleteOnTime: forecastComplete <= totalSprintDays,
      daysEarlyOrLate: totalSprintDays - forecastComplete
    };
  },

  /**
   * Get burndown history for multiple sprints (for trend analysis)
   */
  getBurndownHistory: async (projectId, limit = 5) => {
    try {
      const sprints = await Sprint.find({ project: projectId })
        .sort({ endDate: -1 })
        .limit(limit);

      const history = await Promise.all(
        sprints.map(async (sprint) => {
          const burndown = await burndownService.calculateBurndown(sprint._id);
          return {
            sprintName: sprint.name,
            sprintId: sprint._id,
            committedPoints: burndown.committedPoints,
            completedPoints: burndown.committedPoints - burndown.actual[burndown.actual.length - 1],
            completionPercentage: burndown.completionPercentage,
            health: burndown.health,
            status: sprint.status
          };
        })
      );

      return history;
    } catch (error) {
      console.error('Error getting burndown history:', error);
      throw error;
    }
  },

  /**
   * Get team velocity metrics
   */
  getTeamVelocity: async (projectId, sprintLimit = 5) => {
    try {
      const history = await burndownService.getBurndownHistory(projectId, sprintLimit);

      const closedSprints = history.filter(h => h.status === 'closed');
      if (closedSprints.length === 0) {
        return {
          avgVelocity: 0,
          minVelocity: 0,
          maxVelocity: 0,
          trend: 'insufficient-data',
          sprints: history
        };
      }

      const velocities = closedSprints.map(s => s.completedPoints);
      const avgVelocity = Math.round(velocities.reduce((a, b) => a + b, 0) / velocities.length);
      const minVelocity = Math.min(...velocities);
      const maxVelocity = Math.max(...velocities);

      // Trend: are velocities improving or declining
      const recent = velocities.slice(-3);
      const older = velocities.slice(0, Math.max(1, velocities.length - 3));
      const recentAvg = recent.reduce((a, b) => a + b, 0) / recent.length;
      const olderAvg = older.reduce((a, b) => a + b, 0) / older.length;
      const trend = recentAvg > olderAvg ? 'improving' : recentAvg < olderAvg ? 'declining' : 'stable';

      return {
        avgVelocity,
        minVelocity,
        maxVelocity,
        trend,
        sprints: history
      };
    } catch (error) {
      console.error('Error calculating team velocity:', error);
      throw error;
    }
  }
};

module.exports = burndownService;
