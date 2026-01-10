import React, { useState, useEffect } from 'react';
import axios from 'axios';
import SubTaskPanel from '../components/SubTaskPanel';
import '../styles/TaskDetailExample.css';

/**
 * TaskDetailExample Component
 * Demonstrates complete integration of SubTaskPanel with a work item detail view
 * Shows:
 * - Full task information display
 * - Integrated SubTaskPanel for managing child work items
 * - Status update with parent auto-update
 * - Story points calculation with children
 * - Real-time notifications
 */
const TaskDetailExample = ({ taskId }) => {
  const [task, setTask] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);

  /**
   * Load task details
   */
  useEffect(() => {
    fetchTask();
  }, [taskId]);

  const fetchTask = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await axios.get(
        `/api/tasks/${taskId}`,
        {
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
        }
      );

      if (response.data.success) {
        setTask(response.data.data);
      }
    } catch (err) {
      console.error('Error fetching task:', err);
      setError('Failed to load task details');
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Update task status
   */
  const handleUpdateTaskStatus = async (newStatus) => {
    try {
      const response = await axios.patch(
        `/api/tasks/${taskId}`,
        { status: newStatus },
        {
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
        }
      );

      if (response.data.success) {
        setTask(response.data.data);
        setSuccessMessage('Status updated successfully');
        setTimeout(() => setSuccessMessage(null), 3000);
      }
    } catch (err) {
      console.error('Error updating status:', err);
      setError('Failed to update status');
    }
  };

  /**
   * Handle task update (called when subtasks are modified)
   */
  const handleTaskUpdate = async () => {
    await fetchTask();
  };

  if (isLoading) {
    return (
      <div className="task-detail-container">
        <div className="loading-state">
          <div className="spinner"></div>
          <p>Loading task details...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="task-detail-container">
        <div className="error-state">
          <p className="error-message">{error}</p>
          <button onClick={fetchTask} className="retry-btn">
            Retry
          </button>
        </div>
      </div>
    );
  }

  if (!task) {
    return (
      <div className="task-detail-container">
        <div className="empty-state">
          <p>Task not found</p>
        </div>
      </div>
    );
  }

  const getStatusColor = (status) => {
    const colors = {
      todo: '#6c757d',
      in_progress: '#ffc107',
      in_review: '#17a2b8',
      done: '#28a745'
    };
    return colors[status] || '#ccc';
  };

  const getStatusDisplay = (status) => {
    const display = {
      todo: 'To Do',
      in_progress: 'In Progress',
      in_review: 'In Review',
      done: 'Done'
    };
    return display[status] || status;
  };

  const getPriorityBadgeClass = (priority) => {
    return `priority-badge priority-${priority?.toLowerCase() || 'medium'}`;
  };

  return (
    <div className="task-detail-container">
      {/* Success Message */}
      {successMessage && (
        <div className="success-banner">
          <span className="success-icon">✓</span>
          {successMessage}
        </div>
      )}

      {/* Task Header */}
      <div className="task-header">
        <div className="task-title-section">
          <h1 className="task-title">{task.title}</h1>
          <span className="task-key">{task.issueKey}</span>
        </div>

        <div className="task-meta-section">
          <div className="status-badge-group">
            <label htmlFor="status-select">Status:</label>
            <select
              id="status-select"
              className="status-select"
              value={task.status || 'todo'}
              onChange={(e) => handleUpdateTaskStatus(e.target.value)}
              style={{ borderLeftColor: getStatusColor(task.status) }}
            >
              <option value="todo">To Do</option>
              <option value="in_progress">In Progress</option>
              <option value="in_review">In Review</option>
              <option value="done">Done</option>
            </select>
            <span className="status-text">{getStatusDisplay(task.status)}</span>
          </div>

          {task.priority && (
            <div className={getPriorityBadgeClass(task.priority)}>
              {task.priority.toUpperCase()}
            </div>
          )}
        </div>
      </div>

      {/* Task Details Grid */}
      <div className="task-details-grid">
        <div className="detail-card">
          <h3 className="detail-title">Description</h3>
          <p className="detail-value">
            {task.description || <em>No description provided</em>}
          </p>
        </div>

        <div className="detail-card">
          <h3 className="detail-title">Assigned To</h3>
          <div className="assignee-info">
            {task.assignedTo ? (
              <>
                <div className="assignee-avatar">
                  {task.assignedTo.name
                    ? task.assignedTo.name
                        .split(' ')
                        .map((n) => n[0])
                        .join('')
                    : '?'}
                </div>
                <div className="assignee-details">
                  <p className="assignee-name">{task.assignedTo.name || 'Unknown'}</p>
                  <p className="assignee-email">{task.assignedTo.email || 'No email'}</p>
                </div>
              </>
            ) : (
              <em>Unassigned</em>
            )}
          </div>
        </div>

        <div className="detail-card">
          <h3 className="detail-title">Story Points</h3>
          <div className="points-display">
            <span className="points-value">{task.storyPoints || 0}</span>
            <span className="points-label">points</span>
          </div>
        </div>

        <div className="detail-card">
          <h3 className="detail-title">Project</h3>
          <p className="detail-value">
            {task.project?.name || <em>No project</em>}
          </p>
        </div>

        {task.sprint && (
          <div className="detail-card">
            <h3 className="detail-title">Sprint</h3>
            <p className="detail-value">{task.sprint.name}</p>
          </div>
        )}

        {task.dueDate && (
          <div className="detail-card">
            <h3 className="detail-title">Due Date</h3>
            <p className="detail-value">
              {new Date(task.dueDate).toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'long',
                day: 'numeric'
              })}
            </p>
          </div>
        )}
      </div>

      {/* Subtasks Section */}
      <div className="subtasks-section">
        <SubTaskPanel
          parentTaskId={taskId}
          parentTask={task}
          onTaskUpdate={handleTaskUpdate}
        />
      </div>

      {/* Activity/Timeline Section */}
      <div className="activity-section">
        <h3 className="section-title">Activity</h3>
        <div className="activity-placeholder">
          <p>Activity log and comments will appear here</p>
        </div>
      </div>

      {/* Related Work Items */}
      <div className="related-section">
        <h3 className="section-title">Related</h3>
        <div className="related-placeholder">
          <p>Related work items and links will appear here</p>
        </div>
      </div>
    </div>
  );
};

export default TaskDetailExample;
