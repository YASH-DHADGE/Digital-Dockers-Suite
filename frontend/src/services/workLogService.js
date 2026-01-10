import axios from 'axios';

/**
 * Work Log API Service
 * Handles all work log API calls
 */
const workLogService = {
  /**
   * Start a timer
   */
  startTimer: async (workItemId, description = '') => {
    const response = await axios.post(`/api/work-items/${workItemId}/work-logs/start`, {
      description
    });
    return response.data;
  },

  /**
   * Stop a timer
   */
  stopTimer: async (workItemId) => {
    const response = await axios.post(`/api/work-items/${workItemId}/work-logs/stop`);
    return response.data;
  },

  /**
   * Create manual work log
   */
  createManualLog: async (workItemId, data) => {
    const response = await axios.post(`/api/work-items/${workItemId}/work-logs`, data);
    return response.data;
  },

  /**
   * Get all work logs for a work item
   */
  getWorkLogs: async (workItemId, filters = {}) => {
    const response = await axios.get(`/api/work-items/${workItemId}/work-logs`, {
      params: filters
    });
    return response.data;
  },

  /**
   * Get a specific work log
   */
  getWorkLog: async (workLogId) => {
    const response = await axios.get(`/api/work-logs/${workLogId}`);
    return response.data;
  },

  /**
   * Update a work log
   */
  updateWorkLog: async (workLogId, data) => {
    const response = await axios.patch(`/api/work-logs/${workLogId}`, data);
    return response.data;
  },

  /**
   * Delete a work log
   */
  deleteWorkLog: async (workLogId) => {
    const response = await axios.delete(`/api/work-logs/${workLogId}`);
    return response.data;
  },

  /**
   * Get running timer for current user
   */
  getRunningTimer: async () => {
    const response = await axios.get('/api/users/me/timer');
    return response.data;
  },

  /**
   * Stop all timers for current user
   */
  stopAllTimers: async () => {
    const response = await axios.post('/api/users/me/timers/stop');
    return response.data;
  },

  /**
   * Get time summary for a work item
   */
  getTimeSummary: async (workItemId) => {
    const response = await axios.get(`/api/work-items/${workItemId}/time-summary`);
    return response.data;
  },

  /**
   * Approve a work log
   */
  approveWorkLog: async (workLogId, notes = '') => {
    const response = await axios.post(`/api/work-logs/${workLogId}/approve`, {
      notes
    });
    return response.data;
  },

  /**
   * Get time reports
   */
  getTimeReport: async (type, params = {}) => {
    const response = await axios.get('/api/reports/time', {
      params: { type, ...params }
    });
    return response.data;
  },

  /**
   * Get user time report
   */
  getUserReport: async (userId, startDate, endDate) => {
    return workLogService.getTimeReport('user', { userId, startDate, endDate });
  },

  /**
   * Get project time report
   */
  getProjectReport: async (projectId, startDate, endDate) => {
    return workLogService.getTimeReport('project', { projectId, startDate, endDate });
  },

  /**
   * Get sprint time report
   */
  getSprintReport: async (sprintId) => {
    return workLogService.getTimeReport('sprint', { sprintId });
  },

  /**
   * Get dashboard summary
   */
  getDashboardSummary: async (projectId, days = 7) => {
    return workLogService.getTimeReport('dashboard', { projectId, days });
  }
};

export default workLogService;
