# Real-Time Notifications - Quick Start (5 minutes)

## Step 1: Install Dependencies (1 min)

```bash
# Backend
cd backend
npm install socket.io

# Frontend
cd ../frontend
npm install socket.io-client
```

## Step 2: Update Backend Server (2 min)

Add to your `backend/server.js`:

```javascript
const http = require('http');
const socketIo = require('socket.io');
const WebSocketNotificationHandler = require('./websocket/notificationHandler');
const notificationRoutes = require('./routes/notificationRoutes');

// Existing express app
const app = express();

// Create HTTP server for socket.io
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

// Make available to controllers
app.locals.notificationHandler = notificationHandler;
app.locals.notificationService = notificationHandler.getNotificationService();

// Register routes
app.use('/api/notifications', notificationRoutes);

// Start server with socket.io
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`✅ Server running on port ${PORT}`);
  console.log(`✅ WebSocket notifications enabled`);
});
```

## Step 3: Add NotificationPanel to Frontend (1 min)

Update your header/navbar component:

```javascript
// src/components/common/Header.jsx (or wherever your header is)

import NotificationPanel from '../notifications/NotificationPanel';
import { useAuth } from '../../context/AuthContext';

function Header() {
  const { token } = useAuth();

  return (
    <header>
      {/* ... other header content ... */}
      
      {/* Add notification bell */}
      {token && <NotificationPanel token={token} />}
    </header>
  );
}
```

## Step 4: Trigger Notifications (1 min)

In any controller where you want notifications:

```javascript
// Example: Issue Controller
exports.createIssue = async (req, res) => {
  try {
    // Create issue
    const issue = await Issue.create(req.body);
    
    // Trigger notification
    const { notificationService } = req.app.locals;
    if (notificationService) {
      await notificationService.createNotification({
        recipientId: assigneeId,
        senderId: req.user.id,
        type: 'issue_assigned',
        title: `New Issue: ${issue.title}`,
        description: issue.description,
        entityType: 'issue',
        entityId: issue._id,
        options: {
          entityKey: issue.key,
          icon: '📝',
          actionUrl: `/dashboard/issues/${issue._id}`,
          priority: 'high'
        }
      });
    }
    
    res.json({ success: true, data: { issue } });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};
```

## Step 5: Test It! (0 min)

1. Start your backend: `npm run dev`
2. Start your frontend: `npm start`
3. Open browser to `http://localhost:3000`
4. Look for the bell icon 🔔 in the header
5. Create a test issue/task
6. Watch the notification appear in real-time!

## Environment Variables

Add to `.env` files:

**Backend**
```
JWT_SECRET=your_jwt_secret_here
MONGODB_URI=mongodb://localhost:27017/digital-dockers
FRONTEND_URL=http://localhost:3000
```

**Frontend**
```
REACT_APP_API_URL=http://localhost:5000
```

## What Just Happened? 🚀

✅ WebSocket connection established between frontend and backend
✅ User authenticated on first notification
✅ Real-time events flowing through socket.io
✅ Notifications persisted to MongoDB
✅ Beautiful UI showing unread count and notification panel
✅ Mark as read and archive functionality working
✅ Automatic reconnection on disconnect

## Common Issues

### "Cannot find module 'socket.io'"
```bash
npm install socket.io --save
```

### "WebSocket connection failed"
Check:
- Backend is running on correct port
- CORS is configured correctly
- JWT token is being passed
- Frontend URL in backend env matches

### "Notifications not appearing"
Check:
- Browser console for errors
- Network tab for WebSocket connection
- Backend logs for errors
- Notification recipient ID is correct

## Next: Advanced Usage

### Broadcast to Multiple Users
```javascript
await notificationService.broadcastNotification(
  [userId1, userId2, userId3],
  {
    senderId: currentUserId,
    type: 'sprint_started',
    title: 'Sprint started!',
    // ... rest of notification data
  }
);
```

### Get Unread Count
```javascript
const unreadCount = await Notification.getUnreadCount(userId);
```

### Mark All as Read
```javascript
await notificationService.markAllAsRead(userId);
```

### Get Recent Notifications
```javascript
const feed = await notificationService.getNotificationFeed(userId, 10);
```

## Full Documentation

See `REALTIME_NOTIFICATIONS_SETUP.md` for:
- Complete architecture
- All WebSocket events
- Integration examples
- Troubleshooting
- Performance tips

## Files Created

```
backend/
  ├── models/Notification.js
  ├── services/notificationService.js
  ├── controllers/notificationController.js
  ├── routes/notificationRoutes.js
  ├── websocket/notificationHandler.js
  └── NOTIFICATION_INTEGRATION_EXAMPLES.js

frontend/
  ├── src/
  │   ├── hooks/useRealtimeNotifications.js
  │   ├── components/notifications/
  │   │   ├── NotificationPanel.jsx
  │   │   └── NotificationPanel.css
  │   └── utils/notificationEmitter.js
  └── ...

Documentation/
  ├── REALTIME_NOTIFICATIONS_README.md
  ├── REALTIME_NOTIFICATIONS_SETUP.md
  └── REALTIME_NOTIFICATIONS_QUICK_START.md (this file)
```

---

**That's it! You now have real-time notifications working.** 🎉

**Questions?** Check the setup guide or review the integration examples.
