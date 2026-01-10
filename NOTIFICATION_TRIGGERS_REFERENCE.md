# 🔔 Notification Triggers - Complete Reference

## Overview
All notifications are triggered automatically when users interact with the system. No manual setup needed!

---

## 📋 Triggered Notifications

### 1. ISSUE_ASSIGNED (Issue Created)
**When:** User creates a new issue
**Triggered in:** `backend/controllers/issueController.js` → `POST /projects/:projectId/issues`
**Recipient:** Issue assignee (if assigned)
**Notification Details:**
- Type: `ISSUE_ASSIGNED`
- Title: "New Issue Assigned"
- Description: `${issueKey}: ${issueTitle}`
- Priority: Based on issue priority (CRITICAL→high, HIGH→medium, etc.)
- Metadata includes:
  - `projectId` - Which project
  - `issueKey` - Issue identifier (e.g., PROJ-42)
  - `issueType` - BUG/FEATURE/TASK/EPIC

**Code Location:**
```javascript
// Line ~160 in issueController.js
if (issue.assigneeId) {
    await notificationService.createNotification({
        recipient: issue.assigneeId,
        sender: userId,
        type: 'ISSUE_ASSIGNED',
        title: 'New Issue Assigned',
        description: `${issue.key}: ${issue.title}`,
        // ...
    });
}
```

**Example Notification:**
```
🔔 New Issue Assigned
PROJ-42: Fix login button not clickable
```

---

### 2. ISSUE_STATUS_CHANGED (Issue Status Updated)
**When:** Issue status is changed (e.g., BACKLOG → IN_PROGRESS)
**Triggered in:** `backend/controllers/issueController.js` → `PUT /issues/:issueId/move`
**Recipient:** Issue assignee
**Notification Details:**
- Type: `ISSUE_STATUS_CHANGED`
- Title: "Issue Status Updated"
- Description: `${issueKey}: ${title} moved to ${newStatus}`
- Priority: Medium
- Metadata includes:
  - `oldStatus` - Previous status
  - `newStatus` - Current status
  - `issueKey` - Issue identifier

**Code Location:**
```javascript
// Line ~493 in issueController.js
if (updatedIssue.assigneeId) {
    await notificationService.createNotification({
        recipient: updatedIssue.assigneeId,
        sender: userId,
        type: 'ISSUE_STATUS_CHANGED',
        title: 'Issue Status Updated',
        description: `${updatedIssue.key}: ${updatedIssue.title} moved to ${targetStatus}`,
        // ...
    });
}
```

**Example Notification:**
```
🔔 Issue Status Updated
PROJ-42: Fix login button moved to IN_PROGRESS
```

---

### 3. TASK_ASSIGNED (Task Created)
**When:** New task is created
**Triggered in:** `backend/controllers/taskController.js` → `POST /api/tasks` (createTask function)
**Recipient:** All assigned users
**Notification Details:**
- Type: `TASK_ASSIGNED`
- Title: "New Task Assigned"
- Description: `${taskTitle}${taskKey ? ` (${taskKey})` : ''}`
- Priority: Based on task priority (high→high, medium→medium, etc.)
- Metadata includes:
  - `projectId` - Associated project
  - `taskKey` - Task identifier if exists
  - `dueDate` - When task is due

**Code Location:**
```javascript
// Line ~116 in taskController.js
if (task.assignedTo && task.assignedTo.length > 0) {
    for (const assignee of task.assignedTo) {
        await notificationService.createNotification({
            recipient: assignee._id,
            sender: req.user._id,
            type: 'TASK_ASSIGNED',
            title: 'New Task Assigned',
            description: `${task.title}${task.key ? ` (${task.key})` : ''}`,
            // ...
        });
    }
}
```

**Example Notification:**
```
🔔 New Task Assigned
Fix database migration (PROJ-43)
```

---

### 4. MEETING_SCHEDULED (Meeting Created)
**When:** New meeting is scheduled
**Triggered in:** `backend/controllers/meetingController.js` → `POST /api/meetings/schedule` (scheduleMeeting function)
**Recipient:** All meeting participants
**Notification Details:**
- Type: `MEETING_SCHEDULED`
- Title: "Meeting Scheduled"
- Description: `You're invited to: ${meetingTitle}`
- Priority: HIGH (urgent)
- Metadata includes:
  - `meetingTitle` - Name of meeting
  - `scheduledAt` - Date and time
  - `meetLink` - Google Meet URL
  - `duration` - Meeting length in minutes

**Code Location:**
```javascript
// Line ~130 in meetingController.js
if (processedParticipants && processedParticipants.length > 0) {
    for (const participant of processedParticipants) {
        if (participant.user) {
            await notificationService.createNotification({
                recipient: participant.user,
                sender: req.user._id,
                type: 'MEETING_SCHEDULED',
                title: 'Meeting Scheduled',
                description: `You're invited to: ${title}`,
                // ...
            });
        }
    }
}
```

**Example Notification:**
```
🔔 Meeting Scheduled
You're invited to: Sprint Planning Session
Jan 8, 2026 at 2:00 PM | 60 min | https://meet.google.com/xyz
```

---

## 🎯 Notification Flow Diagram

```
┌─────────────────────────┐
│  User Action            │
│  • Create Issue         │
│  • Change Status        │
│  • Create Task          │
│  • Schedule Meeting     │
└────────────┬────────────┘
             │
             ▼
┌─────────────────────────────────────────┐
│  Controller                             │
│  (issue/task/meeting)                   │
│  • Validate input                       │
│  • Save to database                     │
└────────────┬────────────────────────────┘
             │
             ▼
┌──────────────────────────────────────────────┐
│  NotificationService.createNotification()   │
│  • Create notification object              │
│  • Save to MongoDB                         │
│  • Get Socket.io room: user:{userId}       │
└────────────┬─────────────────────────────────┘
             │
             ▼
┌──────────────────────────────────────────┐
│  Socket.io Emission                      │
│  io.to('user:${userId}')                │
│  .emit('notification:new', {             │
│      type, title, description, ...       │
│  })                                      │
└────────────┬─────────────────────────────┘
             │
             ▼
┌────────────────────────────────────────────┐
│  Frontend Receives (useRealtimeNotifications)│
│  • WebSocket listener catches event       │
│  • Add to notifications array             │
│  • Update unreadCount                     │
└────────────┬──────────────────────────────┘
             │
             ▼
┌──────────────────────────────────────────┐
│  NotificationPanel Component             │
│  • Badge shows unread count              │
│  • Dropdown lists all notifications      │
│  • User sees bell icon update 🔔         │
└──────────────────────────────────────────┘
```

---

## 🔄 Real-Time Broadcasting

In addition to direct notifications, the system also broadcasts events to all connected users:

### Broadcast Events:
```javascript
// Issue created
io.emit('issue:created', { issue, projectId });

// Issue status changed
io.emit('issue:statusChanged', { issueId, oldStatus, newStatus, projectId });

// Task created
io.to(`project:${task.project}`).emit('task:created', task);

// Meeting scheduled
io.emit('meeting:scheduled', { meetingId, title, scheduledAt, participants });
```

These broadcasts allow **real-time updates** on dashboards and boards!

---

## 📊 Notification Data Structure

Each notification saved to MongoDB looks like:

```javascript
{
    _id: ObjectId(...),
    recipient: "user123",           // Who receives it
    sender: "user456",              // Who triggered it
    type: "ISSUE_ASSIGNED",         // Notification type
    title: "New Issue Assigned",    // Short title
    description: "PROJ-42: Fix login button",  // Details
    entityType: "Issue",            // What entity caused it
    entityId: "issue123",           // ID of the entity
    priority: "medium",             // How urgent
    isRead: false,                  // Unread?
    metadata: {                     // Extra data
        projectId: "proj123",
        issueKey: "PROJ-42",
        issueType: "BUG"
    },
    createdAt: "2026-01-08T10:30:00Z",
    updatedAt: "2026-01-08T10:30:00Z",
    expiresAt: "2026-02-07T10:30:00Z"  // Auto-delete after 30 days
}
```

---

## 🎨 Notification UI Examples

### In Dropdown:
```
┌─────────────────────────────────────┐
│ 🔔 Notifications (2)               │ ← Badge shows count
├─────────────────────────────────────┤
│ 📌 New Issue Assigned              │
│    PROJ-42: Fix login button       │
│    2 mins ago                      │ ← Relative time
│    [✓ Mark Read] [📦 Archive]      │ ← Actions
├─────────────────────────────────────┤
│ 📅 Meeting Scheduled               │
│    You're invited to: Sprint...     │
│    1 hour ago                      │
│    [✓ Mark Read] [📦 Archive]      │
├─────────────────────────────────────┤
│            View All →              │
└─────────────────────────────────────┘
```

### Notification Icons:
```
📌 = Issue assigned/updated
✅ = Task completed
📝 = Task assigned
📅 = Meeting scheduled
💬 = Comment/mention
🎯 = Insight generated
```

---

## ⚡ Performance Optimizations

### Database Indexes:
```javascript
// Fast lookup by recipient & unread status
{ recipient: 1, isRead: 1, createdAt: -1 }

// Auto-cleanup old notifications
{ expiresAt: 1 } // TTL index - deletes after 30 days
```

### WebSocket Rooms:
```javascript
// Targeted delivery to specific user
socket.join(`user:${userId}`);
io.to(`user:${userId}`).emit('notification:new', data);
```

### Pagination:
```javascript
// Load notifications in batches (50 at a time)
GET /api/notifications?limit=50&skip=0
```

---

## 🔐 Security

All notifications:
- ✅ Require JWT authentication
- ✅ Validate user has permission to see notification
- ✅ Use MongoDB ObjectIds (cannot be guessed)
- ✅ Sanitized to prevent XSS
- ✅ User ID verified from JWT token

```javascript
// Each request validated with:
const userId = req.user?.id;  // From JWT middleware
if (!userId) {
    return res.status(401).json({ ... });
}
```

---

## 🧪 Testing Each Notification Type

### Test ISSUE_ASSIGNED:
```bash
# 1. Create issue with assignee
POST /api/projects/:projectId/issues
{
    "title": "Test Issue",
    "assigneeId": "user123"
}

# 2. Check notification
GET /api/notifications/feed
# Should include ISSUE_ASSIGNED type
```

### Test ISSUE_STATUS_CHANGED:
```bash
# 1. Move issue to different status
PUT /api/issues/:issueId/move
{ "status": "IN_PROGRESS" }

# 2. Assignee receives notification
GET /api/notifications/feed
# Should show ISSUE_STATUS_CHANGED
```

### Test TASK_ASSIGNED:
```bash
# 1. Create task with assignees
POST /api/tasks
{
    "title": "Test Task",
    "assignedTo": ["user123", "user456"]
}

# 2. Both users get notifications
GET /api/notifications/feed
# Should show TASK_ASSIGNED for each
```

### Test MEETING_SCHEDULED:
```bash
# 1. Schedule meeting with participants
POST /api/meetings/schedule
{
    "title": "Team Meeting",
    "participants": [
        { "userId": "user123" },
        { "userId": "user456" }
    ]
}

# 2. All participants get notifications
GET /api/notifications/feed
# Should show MEETING_SCHEDULED for each
```

---

## 📞 Debugging

### Enable Notification Logs:
```javascript
// In controllers, add:
console.log('Creating notification:', {
    recipient,
    type,
    title,
    description
});
```

### Check WebSocket Events:
```javascript
// Browser Console
socket.on('notification:new', (data) => {
    console.log('📬 New notification:', data);
});
```

### Verify in Database:
```javascript
// MongoDB Shell
db.notifications.find({ recipient: "userId" }).limit(5)
```

---

## ✅ Verification Checklist

After integration, verify:
- [ ] Bell icon appears in header
- [ ] Creating issue sends notification to assignee
- [ ] Changing issue status sends notification
- [ ] Creating task sends to all assignees
- [ ] Scheduling meeting sends to all participants
- [ ] Notifications show in dropdown
- [ ] Clicking notification marks as read
- [ ] Unread badge updates in real-time
- [ ] WebSocket connection shows in Network tab
- [ ] No errors in browser console

---

## 🎉 You're Ready!

All notification triggers are integrated and working. Just:
1. Start backend: `npm run dev` (backend dir)
2. Start frontend: `npm run dev` (frontend dir)
3. Open app and create issues/tasks/meetings
4. See notifications appear instantly! 🚀

The system is **production-ready** and handles real-time delivery for all four notification types!
