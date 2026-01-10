/**
 * Example Notification Integration
 * Shows how to trigger notifications from various controllers
 * Copy and adapt these patterns throughout your application
 */

// ============================================================================
// EXAMPLE 1: Issue Controller - Notify when issue is created
// ============================================================================

async function createIssue(req, res) {
  try {
    const issueData = req.body;
    const currentUserId = req.user.id;

    // Create issue in database
    const issue = await Issue.create({
      ...issueData,
      createdBy: currentUserId,
      project: issueData.projectId
    });

    // Get team members who should be notified
    const project = await Project.findById(issueData.projectId);
    const teamMemberIds = project.members.map(m => m.userId);

    // Trigger notification via NotificationService
    const { notificationService } = req.app.locals;
    
    if (notificationService) {
      await notificationService.createNotification({
        recipientIds: teamMemberIds,
        senderId: currentUserId,
        type: 'issue_created',
        title: `New Issue: ${issue.title}`,
        description: `${issue.title} was created in ${project.name}`,
        entityType: 'issue',
        entityId: issue._id,
        options: {
          entityKey: issue.key,
          icon: '📝',
          actionUrl: `/dashboard/issues/${issue._id}`,
          priority: issue.priority || 'medium',
          metadata: {
            projectId: issue.project,
            projectName: project.name,
            userName: req.user.name
          }
        }
      });
    }

    res.json({
      success: true,
      data: { issue }
    });
  } catch (error) {
    console.error('Error creating issue:', error);
    res.status(500).json({ success: false, error: error.message });
  }
}

// ============================================================================
// EXAMPLE 2: Task Controller - Notify when task is assigned
// ============================================================================

async function assignTask(req, res) {
  try {
    const { taskId, assigneeId } = req.body;
    const currentUserId = req.user.id;

    // Update task assignment
    const task = await Task.findByIdAndUpdate(
      taskId,
      { 
        assignee: assigneeId,
        assignedAt: new Date(),
        assignedBy: currentUserId
      },
      { new: true }
    ).populate('project');

    // Trigger notification
    const { notificationService } = req.app.locals;
    
    if (notificationService) {
      await notificationService.createNotification({
        recipientId: assigneeId,
        senderId: currentUserId,
        type: 'issue_assigned',
        title: `Assigned to you: ${task.title}`,
        description: `You were assigned to ${task.key} by ${req.user.name}`,
        entityType: 'issue',
        entityId: task._id,
        options: {
          entityKey: task.key,
          icon: '👤',
          actionUrl: `/dashboard/issues/${task._id}`,
          priority: 'high',
          metadata: {
            projectId: task.project._id,
            projectName: task.project.name,
            assignedBy: req.user.name
          }
        }
      });
    }

    res.json({
      success: true,
      data: { task }
    });
  } catch (error) {
    console.error('Error assigning task:', error);
    res.status(500).json({ success: false, error: error.message });
  }
}

// ============================================================================
// EXAMPLE 3: Sprint Controller - Notify when sprint starts
// ============================================================================

async function startSprint(req, res) {
  try {
    const { sprintId } = req.body;
    const currentUserId = req.user.id;

    // Update sprint status
    const sprint = await Sprint.findByIdAndUpdate(
      sprintId,
      {
        status: 'ACTIVE',
        startDate: new Date(),
        startedBy: currentUserId
      },
      { new: true }
    ).populate('project');

    // Get team members
    const project = await Project.findById(sprint.project._id);
    const teamMemberIds = project.members.map(m => m.userId);

    // Trigger notification
    const { notificationService } = req.app.locals;
    
    if (notificationService) {
      await notificationService.broadcastNotification(
        teamMemberIds,
        {
          senderId: currentUserId,
          type: 'sprint_started',
          title: `Sprint "${sprint.name}" started`,
          description: `${sprint.name} sprint has begun with ${sprint.tasks.length} tasks`,
          entityType: 'sprint',
          entityId: sprint._id,
          options: {
            icon: '🚀',
            actionUrl: `/dashboard/sprints/${sprint._id}`,
            priority: 'high',
            metadata: {
              projectId: sprint.project._id,
              projectName: sprint.project.name,
              sprintName: sprint.name,
              taskCount: sprint.tasks.length,
              startDate: sprint.startDate
            }
          }
        }
      );
    }

    res.json({
      success: true,
      data: { sprint }
    });
  } catch (error) {
    console.error('Error starting sprint:', error);
    res.status(500).json({ success: false, error: error.message });
  }
}

// ============================================================================
// EXAMPLE 4: Task Controller - Update status and notify
// ============================================================================

async function updateTaskStatus(req, res) {
  try {
    const { taskId, status } = req.body;
    const currentUserId = req.user.id;

    // Get current task to track change
    const oldTask = await Task.findById(taskId);
    const previousStatus = oldTask.status;

    // Update status
    const task = await Task.findByIdAndUpdate(
      taskId,
      { 
        status,
        updatedAt: new Date(),
        updatedBy: currentUserId
      },
      { new: true }
    ).populate('project assignee');

    // Notify assignee and project team
    const { notificationService } = req.app.locals;
    
    if (notificationService) {
      const notificationRecipients = [
        task.assignee._id,
        ...task.watchers || []
      ];

      await notificationService.broadcastNotification(
        notificationRecipients,
        {
          senderId: currentUserId,
          type: 'issue_status_changed',
          title: `${task.key} moved to ${status}`,
          description: `${task.title} status changed from ${previousStatus} to ${status}`,
          entityType: 'issue',
          entityId: task._id,
          options: {
            entityKey: task.key,
            icon: status === 'DONE' ? '✅' : '🔄',
            actionUrl: `/dashboard/issues/${task._id}`,
            priority: status === 'DONE' ? 'medium' : 'low',
            metadata: {
              projectId: task.project._id,
              previousStatus,
              newStatus: status,
              changedBy: req.user.name
            }
          }
        }
      );
    }

    res.json({
      success: true,
      data: { task }
    });
  } catch (error) {
    console.error('Error updating task status:', error);
    res.status(500).json({ success: false, error: error.message });
  }
}

// ============================================================================
// EXAMPLE 5: Comment Controller - Notify on mentions
// ============================================================================

async function createComment(req, res) {
  try {
    const { issueId, text, mentions } = req.body;
    const currentUserId = req.user.id;

    // Create comment
    const comment = await Comment.create({
      issue: issueId,
      author: currentUserId,
      text,
      mentions: mentions || []
    });

    // Get issue details
    const issue = await Issue.findById(issueId).populate('project assignee');

    // Notify assignee
    const { notificationService } = req.app.locals;
    
    if (notificationService && issue.assignee) {
      await notificationService.createNotification({
        recipientId: issue.assignee._id,
        senderId: currentUserId,
        type: 'issue_commented',
        title: `Comment on ${issue.key}`,
        description: `${req.user.name} commented on ${issue.key}: "${text.substring(0, 50)}..."`,
        entityType: 'issue',
        entityId: issue._id,
        options: {
          entityKey: issue.key,
          icon: '💬',
          actionUrl: `/dashboard/issues/${issue._id}`,
          priority: 'medium',
          metadata: {
            projectId: issue.project._id,
            commentAuthor: req.user.name,
            commentPreview: text.substring(0, 100)
          }
        }
      });

      // Notify mentioned users
      if (mentions && mentions.length > 0) {
        await notificationService.broadcastNotification(
          mentions,
          {
            senderId: currentUserId,
            type: 'mention',
            title: `You were mentioned in ${issue.key}`,
            description: `${req.user.name} mentioned you: "${text.substring(0, 50)}..."`,
            entityType: 'issue',
            entityId: issue._id,
            options: {
              entityKey: issue.key,
              icon: '🔔',
              actionUrl: `/dashboard/issues/${issue._id}#comment-${comment._id}`,
              priority: 'high',
              metadata: {
                projectId: issue.project._id,
                mentionedBy: req.user.name
              }
            }
          }
        );
      }
    }

    res.json({
      success: true,
      data: { comment }
    });
  } catch (error) {
    console.error('Error creating comment:', error);
    res.status(500).json({ success: false, error: error.message });
  }
}

// ============================================================================
// EXAMPLE 6: Meeting Controller - Notify attendees
// ============================================================================

async function createMeeting(req, res) {
  try {
    const { title, date, time, attendees, description } = req.body;
    const currentUserId = req.user.id;

    // Create meeting
    const meeting = await Meeting.create({
      title,
      date,
      time,
      attendees,
      description,
      organizer: currentUserId
    });

    // Notify all attendees
    const { notificationService } = req.app.locals;
    
    if (notificationService && attendees && attendees.length > 0) {
      await notificationService.broadcastNotification(
        attendees,
        {
          senderId: currentUserId,
          type: 'meeting_scheduled',
          title: `Meeting scheduled: ${title}`,
          description: `${title} scheduled for ${date} at ${time}`,
          entityType: 'meeting',
          entityId: meeting._id,
          options: {
            icon: '📅',
            actionUrl: `/dashboard/meetings/${meeting._id}`,
            priority: 'medium',
            metadata: {
              meetingTitle: title,
              date,
              time,
              description
            }
          }
        }
      );
    }

    res.json({
      success: true,
      data: { meeting }
    });
  } catch (error) {
    console.error('Error creating meeting:', error);
    res.status(500).json({ success: false, error: error.message });
  }
}

// ============================================================================
// EXPORT - Use these patterns in your controllers
// ============================================================================

module.exports = {
  createIssue,
  assignTask,
  startSprint,
  updateTaskStatus,
  createComment,
  createMeeting
};

/**
 * Key Patterns to Follow:
 * 
 * 1. Always get notificationService from app.locals
 * 2. Use broadcastNotification for multiple users
 * 3. Use createNotification for single user
 * 4. Include entityKey and actionUrl for navigation
 * 5. Set appropriate priority levels
 * 6. Include metadata for context
 * 7. Use meaningful icons/emojis
 * 8. Keep descriptions concise and actionable
 * 9. Handle errors gracefully (don't fail request on notification error)
 * 10. Test notifications in development
 */
