import React from 'react';
import { Progress, Tag, Space } from 'antd';
import { BulbOutlined } from '@ant-design/icons';
import TaskCard from './TaskCard';
import { calculateProgressPercentage, formatMonthYear } from '../../utils/roadmapData';
import '../../styles/MonthColumn.css';

/**
 * MonthColumn Component
 * 
 * Represents a single month in the roadmap timeline with:
 * - Month header with metrics
 * - Planned tasks section
 * - Completed tasks section
 * - Carried over tasks section
 * - AI insight card
 */
const MonthColumn = ({ month, isCurrentMonth }) => {
  const totalPlanned = month.planned.length + month.carriedOver.length;
  const totalCompleted = month.completed.length;
  const progressPercent = calculateProgressPercentage(totalPlanned, totalCompleted);

  return (
    <div className={`month-column ${isCurrentMonth ? 'current-month' : ''}`}>
      {/* Month Header */}
      <div className="month-header">
        <h3 className="month-title">{formatMonthYear(month.date)}</h3>
        
        {/* Metrics */}
        <div className="month-metrics">
          <div className="metrics-text">
            <span className="completed-count">{totalCompleted}</span>
            <span className="divider">/</span>
            <span className="planned-count">{totalPlanned}</span>
            <span className="unit">pts</span>
          </div>
          <div className="progress-display">
            {progressPercent}%
          </div>
        </div>

        {/* Progress Bar */}
        <Progress 
          percent={progressPercent} 
          size="small"
          strokeColor={{
            '0%': '#1890ff',
            '100%': '#52c41a',
          }}
          format={() => null}
        />

        {isCurrentMonth && (
          <Tag color="blue" className="current-badge">Current</Tag>
        )}
      </div>

      {/* Month Content */}
      <div className="month-content">
        
        {/* Planned Section */}
        {month.planned.length > 0 && (
          <div className="month-section planned-section">
            <div className="section-header">
              <span className="section-title">Planned</span>
              <span className="section-count">{month.planned.length}</span>
            </div>
            <div className="section-tasks">
              {month.planned.map((task) => (
                <TaskCard 
                  key={task.id} 
                  task={task} 
                  status="planned"
                />
              ))}
            </div>
          </div>
        )}

        {/* Completed Section */}
        {month.completed.length > 0 && (
          <div className="month-section completed-section">
            <div className="section-header">
              <span className="section-title">Completed</span>
              <span className="section-count">{month.completed.length}</span>
            </div>
            <div className="section-tasks">
              {month.completed.map((task) => (
                <TaskCard 
                  key={task.id} 
                  task={task} 
                  status="completed"
                />
              ))}
            </div>
          </div>
        )}

        {/* Carried Over Section */}
        {month.carriedOver.length > 0 && (
          <div className="month-section carried-section">
            <div className="section-header">
              <span className="section-title">Carried Over</span>
              <span className="section-count">{month.carriedOver.length}</span>
            </div>
            <div className="section-tasks">
              {month.carriedOver.map((task) => (
                <TaskCard 
                  key={task.id} 
                  task={task} 
                  status="carried-over"
                />
              ))}
            </div>
          </div>
        )}

        {/* Empty State */}
        {month.planned.length === 0 && 
         month.completed.length === 0 && 
         month.carriedOver.length === 0 && (
          <div className="empty-state">
            <p>No tasks planned</p>
          </div>
        )}
      </div>

      {/* AI Insight Card */}
      {month.insight && (
        <div className="ai-insight">
          <div className="insight-header">
            <BulbOutlined className="insight-icon" />
            <span>Insight</span>
          </div>
          <p className="insight-text">{month.insight}</p>
        </div>
      )}
    </div>
  );
};

export default MonthColumn;
