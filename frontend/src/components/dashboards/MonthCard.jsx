import React from 'react';
import { Card, Progress, Tag, Tooltip, Row, Col, Empty, Badge } from 'antd';
import { CheckCircleOutlined, ClockCircleOutlined, ExclamationCircleOutlined } from '@ant-design/icons';
import { calculateMonthlyMetrics } from '../../utils/monthlyProgressData';
import './MonthCard.css';

const MonthCard = ({ month, onTaskClick }) => {
    const metrics = calculateMonthlyMetrics(month);

    const getProgressStatus = (percentage) => {
        if (percentage === 100) return 'success';
        if (percentage >= 75) return 'normal';
        if (percentage >= 50) return 'active';
        return 'exception';
    };

    const getStatusColor = (status) => {
        if (status === 'PLANNED') return 'default';
        if (status === 'IN_PROGRESS') return 'processing';
        if (status === 'DONE' || status === true) return 'success';
        return 'default';
    };

    const getStatusIcon = (item) => {
        if (item.completed || item.status === 'DONE') return <CheckCircleOutlined className="status-icon completed" />;
        if (item.status === 'IN_PROGRESS') return <ClockCircleOutlined className="status-icon in-progress" />;
        return null;
    };

    return (
        <div className="month-card-wrapper">
            <Card className={`month-card ${month.isPast ? 'past' : 'future'}`}>
                {/* Header */}
                <div className="month-card-header">
                    <div>
                        <h3 className="month-title">{month.display}</h3>
                        {month.isPast && (
                            <div className="completion-metric">
                                <strong>{metrics.completionPercentage}%</strong> Completed
                            </div>
                        )}
                    </div>
                    {month.isPast && (
                        <Badge count={metrics.completedCount} className="completed-badge" color="#52c41a" />
                    )}
                </div>

                {/* Progress Bar */}
                {month.isPast ? (
                    <div className="progress-section">
                        <div className="progress-label">
                            <span>{metrics.completedPoints} / {metrics.plannedPoints} Points</span>
                        </div>
                        <Progress
                            percent={metrics.completionPercentage}
                            status={getProgressStatus(metrics.completionPercentage)}
                            format={percent => `${percent}%`}
                            strokeColor={{
                                '0%': '#ff4d4f',
                                '50%': '#faad14',
                                '100%': '#52c41a'
                            }}
                        />
                    </div>
                ) : (
                    <div className="progress-section">
                        <div className="progress-label">
                            <span>Planned: {metrics.plannedPoints} Points</span>
                        </div>
                        {metrics.inProgressPoints > 0 && (
                            <div style={{ marginTop: 8 }}>
                                <Progress
                                    percent={(metrics.inProgressPoints / metrics.plannedPoints) * 100}
                                    strokeColor="#1890ff"
                                    format={() => `${metrics.inProgressPoints}pt in progress`}
                                />
                            </div>
                        )}
                    </div>
                )}

                {/* AI Insight Note */}
                <div className="month-note">
                    <p>{month.notes}</p>
                </div>

                {/* Tasks Section */}
                <div className="tasks-section">
                    <h4 className="section-title">
                        {month.isPast ? 'Completed' : 'Planned'} ({metrics.taskCount})
                    </h4>
                    {month.planned.length > 0 ? (
                        <div className="tasks-list">
                            {month.planned.map((task, idx) => (
                                <div
                                    key={idx}
                                    className={`task-item ${task.status || (task.completed ? 'completed' : 'planned')}`}
                                    onClick={() => onTaskClick && onTaskClick(task)}
                                >
                                    <div className="task-content">
                                        <div className="task-header">
                                            <span className="task-name">{task.name}</span>
                                            {task.progress && (
                                                <span className="task-progress">{task.progress}%</span>
                                            )}
                                        </div>
                                        <div className="task-meta">
                                            <span className="story-points">{task.storyPoints}pt</span>
                                            <Tag color={getStatusColor(task.status || task.completed)}>
                                                {task.completed ? 'Done' : task.status || 'Planned'}
                                            </Tag>
                                            {task.assignee && (
                                                <Tooltip title={`Assigned to ${task.assignee}`}>
                                                    <span className="assignee">{task.assignee.split(' ')[0]}</span>
                                                </Tooltip>
                                            )}
                                        </div>
                                    </div>
                                    {getStatusIcon(task)}
                                </div>
                            ))}
                        </div>
                    ) : (
                        <Empty description="No tasks" style={{ margin: '16px 0' }} />
                    )}
                </div>

                {/* Carried Over Section */}
                {month.carried_over.length > 0 && (
                    <div className="carried-over-section">
                        <h4 className="section-title warning">
                            <ExclamationCircleOutlined /> Carried Over ({month.carried_over.length})
                        </h4>
                        <div className="carried-items">
                            {month.carried_over.map((item, idx) => (
                                <div key={idx} className="carried-item">
                                    <div className="item-name">{item.name}</div>
                                    <div className="item-reason">
                                        <small>{item.reason}</small>
                                    </div>
                                    <Tag color="warning">{item.storyPoints}pt</Tag>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Completion Date */}
                {month.isPast && month.planned.some(t => t.completedDate) && (
                    <div className="completion-date">
                        <small>Last completed: {
                            month.planned
                                .filter(t => t.completedDate)
                                .sort((a, b) => new Date(b.completedDate) - new Date(a.completedDate))[0]?.completedDate
                        }</small>
                    </div>
                )}
            </Card>
        </div>
    );
};

export default MonthCard;
