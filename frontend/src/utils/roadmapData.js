/**
 * Roadmap Data Utilities
 * 
 * Contains:
 * - Mocked roadmap data structure
 * - Progress calculation functions
 * - Date formatting utilities
 * - AI insight generation
 */

/**
 * Sample assignees for mock data
 */
const ASSIGNEES = [
  {
    id: 1,
    name: 'Alice Johnson',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Alice'
  },
  {
    id: 2,
    name: 'Bob Smith',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Bob'
  },
  {
    id: 3,
    name: 'Charlie Brown',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Charlie'
  },
  {
    id: 4,
    name: 'Diana Prince',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Diana'
  },
];

/**
 * Mocked roadmap data for Q1 2026
 * 
 * Structure:
 * - months: Array of month objects
 *   - id: Unique identifier
 *   - date: Date object
 *   - isCurrent: Boolean indicating current month
 *   - planned: Array of tasks planned for this month
 *   - completed: Array of tasks completed in this month
 *   - carriedOver: Array of tasks carried over to next month
 *   - insight: AI insight string
 */
export const getRoadmapData = () => {
  const currentDate = new Date();
  
  return {
    months: [
      {
        id: 'jan-2026',
        date: new Date(2026, 0, 1),
        isCurrent: currentDate.getMonth() === 0 && currentDate.getFullYear() === 2026,
        planned: [
          {
            id: 'DDS-001',
            issueKey: 'DDS-001',
            title: 'Set up authentication system',
            points: 5,
            assignee: ASSIGNEES[0],
            epic: 'Platform Foundation',
            dueDate: '2026-01-15',
            completedDate: '2026-01-14',
            status: 'completed'
          },
          {
            id: 'DDS-002',
            issueKey: 'DDS-002',
            title: 'Create project dashboard',
            points: 8,
            assignee: ASSIGNEES[1],
            epic: 'Dashboards',
            dueDate: '2026-01-20',
            completedDate: '2026-01-19',
            status: 'completed'
          },
          {
            id: 'DDS-003',
            issueKey: 'DDS-003',
            title: 'Implement user management',
            points: 13,
            assignee: ASSIGNEES[2],
            epic: 'Platform Foundation',
            dueDate: '2026-01-25',
            status: 'planning'
          },
          {
            id: 'DDS-004',
            issueKey: 'DDS-004',
            title: 'Design database schema',
            points: 5,
            assignee: ASSIGNEES[3],
            epic: 'Infrastructure',
            dueDate: '2026-01-10',
            completedDate: '2026-01-09',
            status: 'completed'
          },
        ],
        completed: [
          {
            id: 'DDS-001-c',
            issueKey: 'DDS-001',
            title: 'Set up authentication system',
            points: 5,
            assignee: ASSIGNEES[0],
            epic: 'Platform Foundation',
            completedDate: '2026-01-14'
          },
          {
            id: 'DDS-002-c',
            issueKey: 'DDS-002',
            title: 'Create project dashboard',
            points: 8,
            assignee: ASSIGNEES[1],
            epic: 'Dashboards',
            completedDate: '2026-01-19'
          },
          {
            id: 'DDS-004-c',
            issueKey: 'DDS-004',
            title: 'Design database schema',
            points: 5,
            assignee: ASSIGNEES[3],
            epic: 'Infrastructure',
            completedDate: '2026-01-09'
          },
        ],
        carriedOver: [
          {
            id: 'DDS-003-carry',
            issueKey: 'DDS-003',
            title: 'Implement user management',
            points: 13,
            assignee: ASSIGNEES[2],
            epic: 'Platform Foundation',
            dueDate: '2026-01-25'
          },
        ],
        insight: 'January started strong with 18/31 pts completed. User management implementation slipped due to scope creep. Adjusted February sprint to absorb overflow.'
      },
      {
        id: 'feb-2026',
        date: new Date(2026, 1, 1),
        isCurrent: currentDate.getMonth() === 1 && currentDate.getFullYear() === 2026,
        planned: [
          {
            id: 'DDS-003-cont',
            issueKey: 'DDS-003',
            title: 'Implement user management',
            points: 13,
            assignee: ASSIGNEES[2],
            epic: 'Platform Foundation',
            dueDate: '2026-02-10',
            completedDate: '2026-02-08'
          },
          {
            id: 'DDS-005',
            issueKey: 'DDS-005',
            title: 'Build notification system',
            points: 8,
            assignee: ASSIGNEES[0],
            epic: 'Communication',
            dueDate: '2026-02-15',
            completedDate: '2026-02-14'
          },
          {
            id: 'DDS-006',
            issueKey: 'DDS-006',
            title: 'Create task management UI',
            points: 13,
            assignee: ASSIGNEES[1],
            epic: 'Task Management',
            dueDate: '2026-02-20',
            status: 'in-progress'
          },
          {
            id: 'DDS-007',
            issueKey: 'DDS-007',
            title: 'API error handling',
            points: 5,
            assignee: ASSIGNEES[3],
            epic: 'Infrastructure',
            dueDate: '2026-02-25'
          },
        ],
        completed: [
          {
            id: 'DDS-003-completed',
            issueKey: 'DDS-003',
            title: 'Implement user management',
            points: 13,
            assignee: ASSIGNEES[2],
            epic: 'Platform Foundation',
            completedDate: '2026-02-08'
          },
          {
            id: 'DDS-005-completed',
            issueKey: 'DDS-005',
            title: 'Build notification system',
            points: 8,
            assignee: ASSIGNEES[0],
            epic: 'Communication',
            completedDate: '2026-02-14'
          },
        ],
        carriedOver: [
          {
            id: 'DDS-006-carry',
            issueKey: 'DDS-006',
            title: 'Create task management UI',
            points: 13,
            assignee: ASSIGNEES[1],
            epic: 'Task Management',
            dueDate: '2026-02-20'
          },
          {
            id: 'DDS-007-carry',
            issueKey: 'DDS-007',
            title: 'API error handling',
            points: 5,
            assignee: ASSIGNEES[3],
            epic: 'Infrastructure',
            dueDate: '2026-02-25'
          },
        ],
        insight: 'February focused on resolving January carryover. User management completed on time. Task UI hit complexity issues mid-sprint; adjusted scope for March.'
      },
      {
        id: 'mar-2026',
        date: new Date(2026, 2, 1),
        isCurrent: currentDate.getMonth() === 2 && currentDate.getFullYear() === 2026,
        planned: [
          {
            id: 'DDS-006-cont',
            issueKey: 'DDS-006',
            title: 'Create task management UI',
            points: 13,
            assignee: ASSIGNEES[1],
            epic: 'Task Management',
            dueDate: '2026-03-15',
            status: 'in-progress'
          },
          {
            id: 'DDS-007-cont',
            issueKey: 'DDS-007',
            title: 'API error handling',
            points: 5,
            assignee: ASSIGNEES[3],
            epic: 'Infrastructure',
            dueDate: '2026-03-10'
          },
          {
            id: 'DDS-008',
            issueKey: 'DDS-008',
            title: 'Sprint planning tools',
            points: 8,
            assignee: ASSIGNEES[0],
            epic: 'Planning',
            dueDate: '2026-03-20'
          },
          {
            id: 'DDS-009',
            issueKey: 'DDS-009',
            title: 'Analytics dashboard',
            points: 13,
            assignee: ASSIGNEES[2],
            epic: 'Analytics',
            dueDate: '2026-03-25'
          },
        ],
        completed: [],
        carriedOver: [],
        insight: 'March planning includes resolving Feb carryover items. Focus on stabilizing core features before Q2 expansion.'
      },
      {
        id: 'apr-2026',
        date: new Date(2026, 3, 1),
        isCurrent: false,
        planned: [
          {
            id: 'DDS-010',
            issueKey: 'DDS-010',
            title: 'Integrate Slack notifications',
            points: 8,
            assignee: ASSIGNEES[0],
            epic: 'Integrations',
            dueDate: '2026-04-15'
          },
          {
            id: 'DDS-011',
            issueKey: 'DDS-011',
            title: 'Advanced reporting',
            points: 13,
            assignee: ASSIGNEES[1],
            epic: 'Analytics',
            dueDate: '2026-04-20'
          },
        ],
        completed: [],
        carriedOver: [],
        insight: 'April marks beginning of Q2. Planning includes third-party integrations and advanced reporting features.'
      },
    ]
  };
};

/**
 * Calculate progress percentage
 * @param {number} total - Total planned points
 * @param {number} completed - Completed points
 * @returns {number} Progress percentage (0-100)
 */
export const calculateProgressPercentage = (total, completed) => {
  if (total === 0) return 0;
  return Math.round((completed / total) * 100);
};

/**
 * Format date to "Jan 2026" format
 * @param {Date} date - Date object
 * @returns {string} Formatted date string
 */
export const formatMonthYear = (date) => {
  const options = { month: 'short', year: 'numeric' };
  return new Intl.DateTimeFormat('en-US', options).format(date);
};

/**
 * Generate AI insight based on month metrics
 * @param {Object} month - Month object
 * @returns {string} AI insight text
 */
export const generateInsight = (month) => {
  const total = month.planned.length + month.carriedOver.length;
  const completed = month.completed.length;
  const completionRate = calculateProgressPercentage(total, completed);

  if (completionRate === 100) {
    return '💯 Perfect month! All planned items completed on schedule.';
  } else if (completionRate >= 80) {
    return `✅ Strong execution: ${completionRate}% completion. Minor carryover to next month.`;
  } else if (completionRate >= 60) {
    return `⚠️ Moderate progress: ${completionRate}% completion. Review scope and team capacity.`;
  } else if (completionRate >= 40) {
    return `📊 Execution gaps: ${completionRate}% completion. Significant carryover detected.`;
  } else {
    return `🔴 Critical: ${completionRate}% completion. Major scope mismatch. Immediate review needed.`;
  }
};

/**
 * Calculate team velocity for a period
 * @param {Array} months - Array of month objects
 * @returns {number} Average velocity in points/month
 */
export const calculateTeamVelocity = (months) => {
  const totalCompleted = months.reduce((sum, m) => sum + m.completed.length, 0);
  return Math.round(totalCompleted / months.length);
};

/**
 * Get tasks that slipped from one month to next
 * @param {Object} currentMonth - Current month object
 * @param {Object} nextMonth - Next month object
 * @returns {Array} Array of slipped tasks
 */
export const getSlippedTasks = (currentMonth, nextMonth) => {
  return currentMonth.carriedOver.filter(task => 
    nextMonth.planned.some(planned => planned.issueKey === task.issueKey)
  );
};

export default {
  getRoadmapData,
  calculateProgressPercentage,
  formatMonthYear,
  generateInsight,
  calculateTeamVelocity,
  getSlippedTasks,
};
