import React, { useState } from 'react';
import { Tooltip, Tag, Avatar, Space } from 'antd';
import { CheckCircleOutlined, ClockCircleOutlined } from '@ant-design/icons';
import '../../styles/TaskCard.css';

/**
 * TaskCard Component
 * 
 * Displays a single task/issue with:
 * - Issue key and title
 * - Status indicator
 * - Hover details (assignee, points, completion date)
 * - Click to view details
 */
const TaskCard = ({ task, status }) => {
  const [hovered, setHovered] = useState(false);

  /**
   * Get status icon based on task status
   */
  const getStatusIcon = () => {
    switch (status) {
      case 'completed':
        return <CheckCircleOutlined className="status-icon completed" />;
      case 'carried-over':
        return <ClockCircleOutlined className="status-icon carried" />;
      case 'planned':
      default:
        return <div className="status-icon planned"></div>;
    }
  };

  /**
   * Get color based on status
   */
  const getStatusColor = () => {
    switch (status) {
      case 'completed':
        return '#52c41a';
      case 'carried-over':
        return '#faad14';
      case 'planned':
      default:
        return '#1890ff';
    }
  };

  /**
   * Get background color based on status
   */
  const getStatusBgColor = () => {
    switch (status) {
      case 'completed':
        return '#f6ffed';
      case 'carried-over':
        return '#fffbe6';
      case 'planned':
      default:
        return '#e6f7ff';
    }
  };

  const tooltipContent = (
    <div className="task-tooltip">
      <div className="tooltip-row">
        <span className="tooltip-label">Issue:</span>
        <span className="tooltip-value">{task.issueKey}</span>
      </div>
      <div className="tooltip-row">
        <span className="tooltip-label">Story Points:</span>
        <span className="tooltip-value">{task.points} pts</span>
      </div>
      {task.assignee && (
        <div className="tooltip-row">
          <span className="tooltip-label">Assignee:</span>
          <span className="tooltip-value">
            <Avatar size={20} src={task.assignee.avatar} />
            {task.assignee.name}
          </span>
        </div>
      )}
      {task.completedDate && (
        <div className="tooltip-row">
          <span className="tooltip-label">Completed:</span>
          <span className="tooltip-value">{task.completedDate}</span>
        </div>
      )}
      {task.dueDate && (
        <div className="tooltip-row">
          <span className="tooltip-label">Due:</span>
          <span className="tooltip-value">{task.dueDate}</span>
        </div>
      )}
      <div className="tooltip-row">
        <span className="tooltip-label">Epic:</span>
        <span className="tooltip-value">{task.epic || 'No epic'}</span>
      </div>
    </div>
  );

  return (
    <Tooltip 
      title={tooltipContent}
      placement="top"
      color="#fff"
      overlayClassName="task-tooltip-overlay"
    >
      <div
        className={`task-card ${status}`}
        style={{
          borderLeftColor: getStatusColor(),
          backgroundColor: getStatusBgColor(),
        }}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
      >
        {/* Status Icon */}
        <div className="task-icon">
          {getStatusIcon()}
        </div>

        {/* Task Content */}
        <div className="task-content">
          {/* Issue Key */}
          <div className="task-key">{task.issueKey}</div>
          
          {/* Task Title */}
          <div className="task-title">{task.title}</div>

          {/* Task Meta */}
          <div className="task-meta">
            <span className="task-points">{task.points} pts</span>
            {task.assignee && (
              <Avatar 
                size={20} 
                src={task.assignee.avatar}
                title={task.assignee.name}
              />
            )}
          </div>
        </div>

        {/* Hover Overlay */}
        {hovered && (
          <div className="task-hover-indicator">
            <span>View Details →</span>
          </div>
        )}
      </div>
    </Tooltip>
  );
};

export default TaskCard;
