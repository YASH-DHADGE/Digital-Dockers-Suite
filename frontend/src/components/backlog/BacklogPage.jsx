import { useState, useEffect } from 'react';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import { Card, Button, Select, Table, Tag, Avatar, Space, Empty, message, Typography, Row, Col, Divider } from 'antd';
import { PlusOutlined, BugOutlined, CheckCircleOutlined, FileTextOutlined } from '@ant-design/icons';
import { useProject } from '../../context/ProjectContext';
import taskService from '../../services/taskService';
import CreateIssueModal from '../tasks/CreateIssueModal';
import './BacklogPage.css';

const { Title, Text } = Typography;

const ISSUE_TYPE_ICONS = {
    bug: <BugOutlined style={{ color: '#ae2a19' }} />,
    task: <CheckCircleOutlined style={{ color: '#0052cc' }} />,
    story: <FileTextOutlined style={{ color: '#216e4e' }} />,
    feature: <FileTextOutlined style={{ color: '#0052cc' }} />,
    epic: <FileTextOutlined style={{ color: '#974f0c' }} />
};

const PRIORITY_COLORS = {
    highest: '#ae2a19',
    high: '#eb5757',
    medium: '#f59e0b',
    low: '#10b981',
    lowest: '#6b7280'
};

const BacklogPage = () => {
    const { currentProject, sprints, activeSprint } = useProject();
    const [issues, setIssues] = useState([]);
    const [backlogIssues, setBacklogIssues] = useState([]);
    const [sprintIssues, setSprintIssues] = useState([]);
    const [loading, setLoading] = useState(false);
    const [createModalOpen, setCreateModalOpen] = useState(false);

    // Load issues on mount or when project/sprint changes
    useEffect(() => {
        if (currentProject?._id) {
            loadBacklogIssues();
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [currentProject, activeSprint, sprints]);

    const loadBacklogIssues = async () => {
        setLoading(true);
        try {
            const data = await taskService.getTasks({
                projectId: currentProject._id
            });
            
            setIssues(data);
            
            // Separate into backlog and sprint issues
            const backlog = data.filter(issue => !issue.sprint);
            const sprint = data.filter(issue => issue.sprint?._id === activeSprint?._id);
            
            setBacklogIssues(backlog);
            setSprintIssues(sprint);
        } catch (error) {
            console.error('Failed to load issues:', error);
            message.error('Failed to load backlog');
        } finally {
            setLoading(false);
        }
    };

    const handleDragEnd = async (result) => {
        const { source, destination, draggableId } = result;

        if (!destination) return;
        if (source.droppableId === destination.droppableId && 
            source.index === destination.index) return;

        const sourceSection = source.droppableId; // 'backlog' or 'sprint'
        const destSection = destination.droppableId;

        // Find the dragged issue
        const draggedIssue = [...backlogIssues, ...sprintIssues].find(i => i._id === draggableId);
        if (!draggedIssue) return;

        // Determine new sprint ID
        const newSprintId = destSection === 'sprint' ? activeSprint?._id : null;

        // Optimistic update
        if (sourceSection === 'backlog' && destSection === 'sprint') {
            setBacklogIssues(prev => prev.filter(i => i._id !== draggableId));
            setSprintIssues(prev => [...prev, { ...draggedIssue, sprint: activeSprint }]);
        } else if (sourceSection === 'sprint' && destSection === 'backlog') {
            setSprintIssues(prev => prev.filter(i => i._id !== draggableId));
            setBacklogIssues(prev => [...prev, { ...draggedIssue, sprint: null }]);
        }

        // API call
        try {
            await taskService.updateTask(draggableId, { sprint: newSprintId });
            message.success('Issue moved successfully');
        } catch (error) {
            console.error('Failed to move issue:', error);
            message.error('Failed to move issue');
            // Revert
            loadBacklogIssues();
        }
    };

    const IssueRow = ({ issue, index, isDragging }) => (
        <Draggable draggableId={issue._id} index={index}>
            {(provided, snapshot) => (
                <div
                    ref={provided.innerRef}
                    {...provided.draggableProps}
                    {...provided.dragHandleProps}
                    className={`issue-row ${snapshot.isDragging ? 'dragging' : ''}`}
                    style={{
                        ...provided.draggableProps.style,
                        backgroundColor: snapshot.isDragging ? '#f0f2f5' : 'transparent',
                        padding: '12px',
                        borderRadius: '4px',
                        marginBottom: '8px',
                        border: '1px solid #e8e8e8',
                        cursor: 'grab'
                    }}
                >
                    <Row align="middle" gutter={[16, 0]} style={{ width: '100%' }}>
                        {/* Type Icon */}
                        <Col span={2} style={{ textAlign: 'center' }}>
                            {ISSUE_TYPE_ICONS[issue.issueType] || ISSUE_TYPE_ICONS.task}
                        </Col>

                        {/* Key */}
                        <Col span={3}>
                            <Text strong style={{ fontSize: 12, color: '#0052cc' }}>
                                {issue.key || `ISSUE-${issue._id?.slice(-4).toUpperCase()}`}
                            </Text>
                        </Col>

                        {/* Title */}
                        <Col span={12}>
                            <Text ellipsis style={{ fontSize: 13 }}>
                                {issue.title}
                            </Text>
                        </Col>

                        {/* Priority */}
                        <Col span={3}>
                            {issue.priority && (
                                <Tag
                                    color={PRIORITY_COLORS[issue.priority] || '#666'}
                                    style={{ fontSize: 11, margin: 0 }}
                                >
                                    {issue.priority}
                                </Tag>
                            )}
                        </Col>

                        {/* Assignee */}
                        <Col span={4} style={{ textAlign: 'right' }}>
                            {issue.assignedTo && issue.assignedTo.length > 0 ? (
                                <Avatar.Group maxCount={2} size="small">
                                    {issue.assignedTo.map(assignee => (
                                        <Avatar
                                            key={assignee._id}
                                            size="small"
                                            title={assignee.fullName || assignee.name}
                                        >
                                            {(assignee.fullName || assignee.name)?.[0]?.toUpperCase()}
                                        </Avatar>
                                    ))}
                                </Avatar.Group>
                            ) : (
                                <Text type="secondary" style={{ fontSize: 12 }}>Unassigned</Text>
                            )}
                        </Col>
                    </Row>
                </div>
            )}
        </Draggable>
    );

    if (!currentProject) {
        return <Empty description="Select a Project" />;
    }

    return (
        <div style={{ padding: '24px' }}>
            {/* Header */}
            <div style={{ marginBottom: '32px' }}>
                <Row align="middle" justify="space-between">
                    <Col>
                        <Title level={2} style={{ marginBottom: 0 }}>
                            {currentProject.name} - Backlog
                        </Title>
                    </Col>
                    <Col>
                        <Button
                            type="primary"
                            size="large"
                            icon={<PlusOutlined />}
                            onClick={() => setCreateModalOpen(true)}
                        >
                            Create Issue
                        </Button>
                    </Col>
                </Row>
            </div>

            {/* Create Issue Modal */}
            <CreateIssueModal
                open={createModalOpen}
                onClose={() => setCreateModalOpen(false)}
                onIssueCreated={() => {
                    loadBacklogIssues();
                    setCreateModalOpen(false);
                }}
            />

            {/* Main Content */}
            <DragDropContext onDragEnd={handleDragEnd}>
                <Row gutter={[32, 32]}>
                    {/* Backlog Section */}
                    <Col xs={24} lg={12}>
                        <Card 
                            title={
                                <Text strong>
                                    Backlog ({backlogIssues.length})
                                </Text>
                            }
                            style={{ height: '100%' }}
                            bodyStyle={{ maxHeight: '600px', overflowY: 'auto' }}
                        >
                            <Droppable droppableId="backlog">
                                {(provided, snapshot) => (
                                    <div
                                        ref={provided.innerRef}
                                        {...provided.droppableProps}
                                        style={{
                                            backgroundColor: snapshot.isDraggingOver ? '#fafafa' : 'transparent',
                                            padding: '8px',
                                            borderRadius: '4px',
                                            transition: 'background-color 0.2s'
                                        }}
                                    >
                                        {backlogIssues.length === 0 ? (
                                            <Empty description="No backlog items" size="small" />
                                        ) : (
                                            backlogIssues.map((issue, index) => (
                                                <IssueRow
                                                    key={issue._id}
                                                    issue={issue}
                                                    index={index}
                                                />
                                            ))
                                        )}
                                        {provided.placeholder}
                                    </div>
                                )}
                            </Droppable>
                        </Card>
                    </Col>

                    {/* Sprint Section */}
                    <Col xs={24} lg={12}>
                        <Card
                            title={
                                <div>
                                    <Text strong>
                                        {activeSprint?.name || 'No Active Sprint'} ({sprintIssues.length})
                                    </Text>
                                    {activeSprint && (
                                        <Tag
                                            color={
                                                activeSprint.status === 'active' ? '#52c41a' :
                                                activeSprint.status === 'planning' ? '#1890ff' : '#999'
                                            }
                                            style={{ marginLeft: '8px' }}
                                        >
                                            {activeSprint.status}
                                        </Tag>
                                    )}
                                </div>
                            }
                            style={{ height: '100%' }}
                            bodyStyle={{ maxHeight: '600px', overflowY: 'auto' }}
                        >
                            {!activeSprint ? (
                                <Empty description="No active sprint selected" size="small" />
                            ) : (
                                <Droppable droppableId="sprint">
                                    {(provided, snapshot) => (
                                        <div
                                            ref={provided.innerRef}
                                            {...provided.droppableProps}
                                            style={{
                                                backgroundColor: snapshot.isDraggingOver ? '#deebff' : 'transparent',
                                                padding: '8px',
                                                borderRadius: '4px',
                                                transition: 'background-color 0.2s'
                                            }}
                                        >
                                            {sprintIssues.length === 0 ? (
                                                <Empty description="No sprint issues" size="small" />
                                            ) : (
                                                sprintIssues.map((issue, index) => (
                                                    <IssueRow
                                                        key={issue._id}
                                                        issue={issue}
                                                        index={index}
                                                    />
                                                ))
                                            )}
                                            {provided.placeholder}
                                        </div>
                                    )}
                                </Droppable>
                            )}
                        </Card>
                    </Col>
                </Row>
            </DragDropContext>
        </div>
    );
};

export default BacklogPage;
