# Real-Time Notification System Setup Guide

## Overview

This comprehensive real-time notification system enables instant notifications across your Digital Dockers Suite application using WebSocket connections and a MongoDB-backed persistence layer.

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                      Frontend Application                    │
│                                                               │
│  ┌──────────────────────────────────────────────────────┐   │
│  │ NotificationPanel Component                          │   │
│  │ - Displays notifications in dropdown                │   │
│  │ - Shows unread count badge                          │   │
│  │ - Real-time updates via WebSocket                   │   │
│  └──────────────────────────────────────────────────────┘   │
│                           ↑                                   │
│                    useRealtimeNotifications Hook              │
│              (Manages WebSocket connection)                   │
└─────────────────────────────────────────────────────────────┘
                            ↕ WebSocket
┌─────────────────────────────────────────────────────────────┐
│                      Backend Server                          │
│                                                               │
│  ┌──────────────────────────────────────────────────────┐   │
│  │ WebSocketNotificationHandler                         │   │
│  │ - Manages socket connections                        │   │
│  │ - Emits real-time events                           │   │
│  │ - Handles user authentication                       │   │
│  └──────────────────────────────────────────────────────┘   │
│                           ↕                                   │
│  ┌──────────────────────────────────────────────────────┐   │
│  │ NotificationService                                 │   │
│  │ - Creates notifications                             │   │
│  │ - Manages user socket connections                   │   │
│  │ - Broadcasts to multiple users                      │   │
│  └──────────────────────────────────────────────────────┘   │
│                           ↕                                   │
│  ┌──────────────────────────────────────────────────────┐   │
│  │ Notification Model (MongoDB)                         │   │
│  │ - Persists notification data                        │   │
│  │ - Tracks read/unread status                         │   │
│  │ - Manages notification lifecycle                    │   │
│  └──────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
```

## Files Created

### Backend

1. **`backend/models/Notification.js`**
   - Mongoose schema for notifications
   - Methods for managing notification state
   - Indexes for efficient querying
   - TTL index for auto-cleanup

2. **`backend/services/notificationService.js`**
   - Core notification business logic
   - Socket connection management
   - Real-time delivery system
   - Broadcast capabilities

3. **`backend/controllers/notificationController.js`**
   - HTTP endpoints for notification management
   - Pagination support
   - Statistics and analytics

4. **`backend/routes/notificationRoutes.js`**
   - RESTful API routes
   - All protected (authentication required)

5. **`backend/websocket/notificationHandler.js`**
   - WebSocket event handlers
   - Socket authentication
   - Real-time event emission

### Frontend

1. **`frontend/src/hooks/useRealtimeNotifications.js`**
   - Custom React hook for notification management
   - WebSocket connection handling
   - Automatic reconnection with backoff
   - Event listeners for real-time updates

2. **`frontend/src/components/notifications/NotificationPanel.jsx`**
   - Visual notification dropdown component
   - Displays recent notifications
   - Archive and read functionality
   - Unread count badge

3. **`frontend/src/components/notifications/NotificationPanel.css`**
   - Responsive styling
   - Dark mode support
   - Animations and transitions

4. **`frontend/src/utils/notificationEmitter.js`**
   - Helper utilities for creating notifications
   - Type-specific notification factories
   - Integration points throughout the app

## Installation & Setup

### 1. Backend Setup

#### Install Dependencies
```bash
cd backend
npm install socket.io socket.io-client
```

#### Update `server.js`

```javascript
const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const notificationRoutes = require('./routes/notificationRoutes');
const WebSocketNotificationHandler = require('./websocket/notificationHandler');

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    methods: ['GET', 'POST'],
    credentials: true
  }
});

// Initialize notification handler
const notificationHandler = new WebSocketNotificationHandler(io);
notificationHandler.initialize();

// Make available globally
app.locals.notificationHandler = notificationHandler;
app.locals.notificationService = notificationHandler.getNotificationService();

// Register routes
app.use('/api/notifications', notificationRoutes);

// ... rest of your server setup
```

#### Add to `server.js` startup

```javascript
// Cleanup job - run daily
setInterval(() => {
  app.locals.notificationService.cleanupOldNotifications(30);
}, 24 * 60 * 60 * 1000);

server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`WebSocket notification system initialized`);
});
```

### 2. Frontend Setup

#### Install Dependencies
```bash
cd frontend
npm install socket.io-client
```

#### Update `App.jsx` or Header Component

```javascript
import NotificationPanel from './components/notifications/NotificationPanel';

function App() {
  const { token } = useAuth(); // Get token from your auth context

  return (
    <div className="app">
      {/* ... other components */}
      
      {/* Add notification panel to header/navbar */}
      {token && <NotificationPanel token={token} />}
    </div>
  );
}
```

### 3. Environment Variables

**Backend (.env)**
```
JWT_SECRET=your_jwt_secret
MONGODB_URI=mongodb://localhost:27017/digital-dockers
FRONTEND_URL=http://localhost:3000
```

**Frontend (.env)**
```
REACT_APP_API_URL=http://localhost:5000
```

## Usage Examples

### Create a Notification (from Backend)

```javascript
// In any controller or service

const { notificationService } = app.locals;

// Create notification for single user
await notificationService.createNotification({
  recipientId: userId,
  senderId: currentUserId,
  type: 'issue_assigned',
  title: 'Issue assigned to you',
  description: 'You were assigned to PROJ-123',
  entityType: 'issue',
  entityId: issueId,
  options: {
    entityKey: 'PROJ-123',
    icon: '👤',
    actionUrl: `/dashboard/issues/${issueId}`,
    priority: 'high'
  }
});

// Broadcast to multiple users
await notificationService.broadcastNotification(
  [userId1, userId2, userId3],
  {
    senderId: currentUserId,
    type: 'sprint_started',
    title: 'Sprint started',
    description: 'Sprint: Development Sprint 1',
    entityType: 'sprint',
    entityId: sprintId,
    options: {
      icon: '🚀',
      priority: 'medium'
    }
  }
);
```

### Use Notification Emitter (from Frontend)

```javascript
import notificationEmitter from './utils/notificationEmitter';

// In your auth/login logic
const token = getAuthToken();
notificationEmitter.setAuthToken(token);

// Trigger notifications from various actions
await notificationEmitter.notifyIssueAssigned(
  currentUserId,
  {
    id: issueId,
    key: 'PROJ-101',
    title: 'Fix authentication bug',
    projectId,
    projectName: 'Digital Dockers'
  },
  [assigneeId]
);

// Notify on sprint start
await notificationEmitter.notifySprintStarted(
  currentUserId,
  {
    id: sprintId,
    name: 'Sprint 1',
    taskCount: 15
  },
  teamMemberIds
);
```

### Use Real-Time Notifications Hook (from Frontend)

```javascript
import useRealtimeNotifications from './hooks/useRealtimeNotifications';

function MyComponent() {
  const { 
    notifications, 
    unreadCount, 
    isConnected, 
    markAsRead, 
    markAllAsRead 
  } = useRealtimeNotifications(token);

  return (
    <div>
      <h1>Notifications ({unreadCount})</h1>
      {notifications.map(notif => (
        <div key={notif.id} onClick={() => markAsRead(notif.id)}>
          {notif.title}
        </div>
      ))}
    </div>
  );
}
```

## Notification Types

The system supports the following notification types:

- `issue_created` - When an issue is created
- `issue_assigned` - When assigned to an issue
- `issue_status_changed` - When issue status changes
- `issue_commented` - When commented on an issue
- `task_completed` - When a task is completed
- `sprint_started` - When sprint begins
- `sprint_completed` - When sprint ends
- `mention` - When mentioned in a comment/issue
- `document_shared` - When document is shared
- `meeting_scheduled` - When meeting is scheduled
- `project_added` - When new project is created
- `team_invite` - When invited to team
- `deadline_reminder` - Deadline reminders
- `ai_insight` - AI-generated insights

## WebSocket Events

### Client → Server

- `notification:authenticate` - Initial authentication
- `notification:read` - Mark as read
- `notification:readAll` - Mark all as read
- `notification:archive` - Archive notification
- `notification:fetch` - Fetch notification feed
- `notification:ping` - Heartbeat

### Server → Client

- `notification:new` - New notification received
- `notification:unreadCount` - Unread count updated
- `notification:marked-read` - Notification marked as read
- `notification:all-marked-read` - All marked as read
- `notification:archived` - Notification archived

## Features

✅ **Real-Time Delivery** - Instant notifications via WebSocket
✅ **Persistence** - All notifications stored in MongoDB
✅ **Offline Support** - Notifications fetched on reconnect
✅ **Pagination** - API supports paginated notification fetch
✅ **Read/Unread** - Track notification read status
✅ **Priority Levels** - low, medium, high, urgent
✅ **Auto-Cleanup** - TTL index removes old notifications
✅ **Broadcast** - Send to multiple users simultaneously
✅ **Reconnection** - Automatic reconnect with exponential backoff
✅ **Dark Mode** - Full dark mode support
✅ **Responsive** - Mobile-friendly UI
✅ **Type-Safe** - Comprehensive error handling

## Performance Considerations

1. **Indexes** - Notification model has indexes on recipient, type, and createdAt
2. **TTL** - Automatic deletion of old notifications (30 days default)
3. **Pagination** - API supports offset-based pagination
4. **Socket Rooms** - Users joined to `user:{userId}` room for targeted delivery
5. **Connection Pooling** - Reuses socket connections efficiently

## Troubleshooting

### Notifications not appearing

1. Check WebSocket connection in browser console
2. Verify `notification:authenticate` is called with valid token
3. Check MongoDB connectivity
4. Review backend logs for errors

### Connection drops frequently

1. Increase reconnection delay: modify socket config in hook
2. Check network stability
3. Verify CORS configuration in socket.io setup

### Unread count not updating

1. Verify `notification:unreadCount` events are being emitted
2. Check if user is properly registered in socket connections
3. Test API endpoint directly: `GET /api/notifications/unread/count`

## Future Enhancements

- Email notifications as fallback
- SMS notifications for urgent items
- Notification preferences per user
- Digest notifications (daily/weekly summary)
- Notification scheduling
- Template system for consistent formatting
- Analytics on notification engagement

---

**Last Updated**: January 8, 2026
**Version**: 1.0.0
