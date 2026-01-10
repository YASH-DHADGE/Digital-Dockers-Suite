# 🧪 Testing Notifications - Step by Step

## Quick Test (5 minutes)

### Step 1: Start Backend
```bash
cd backend
npm run dev
```

**Expected Output:**
```
Server running in development mode on port 5000
MongoDB connected
Notification WebSocket initialized ✓
Routes registered ✓
```

### Step 2: Start Frontend (NEW TERMINAL)
```bash
cd frontend
npm run dev
```

**Expected Output:**
```
VITE v4.x.x ready in xxx ms
➜  Local:   http://localhost:5173
```

### Step 3: Open App
```
Open browser: http://localhost:5173
Login with credentials
```

---

## 📋 Test Case 1: Issue Creation Notification

### Setup:
- You're logged in as User A
- User B is another user in the system

### Test Steps:

**Step 1:** Navigate to Projects
```
Click: Projects → View Project → Create Issue
```

**Step 2:** Create Issue
```
Form Fields:
- Title: "Test Notification Issue"
- Type: Bug
- Priority: HIGH
- Assignee: [Select User B]

Click: Create
```

**Step 3:** Verify Notification
```
Expected Results:
- Success message shows
- Issue created in backlog
- User B gets notification instantly
```

**Step 4:** Check User B Receives It
```
If testing with 2 browsers:
1. Open browser window as User B
2. Look at bell icon 🔔 in top right
3. Should show red badge with "1"
4. Click bell to see:
   "New Issue Assigned"
   "Test Notification Issue"
```

**Step 5:** Check Database (Optional)
```bash
# In MongoDB
db.notifications.findOne({
    type: "ISSUE_ASSIGNED",
    recipient: ObjectId("userBId")
})

# Should show:
{
    _id: ObjectId(...),
    type: "ISSUE_ASSIGNED",
    title: "New Issue Assigned",
    description: "TEST-1: Test Notification Issue",
    recipient: ObjectId("..."),
    sender: ObjectId("..."),
    isRead: false,
    createdAt: ISODate("2026-01-08T...")
}
```

---

## 📋 Test Case 2: Issue Status Change Notification

### Setup:
- Have an issue assigned to User B
- You're logged in as User A (issue creator/admin)

### Test Steps:

**Step 1:** Open Issue
```
Navigate to: Projects → Issue Board
Find: The issue assigned to User B
```

**Step 2:** Change Status
```
Drag issue from: BACKLOG → IN_PROGRESS

OR

Click issue → Status dropdown → Select IN_PROGRESS
```

**Step 3:** Verify Notification
```
Expected Result:
- Status changes immediately
- User B gets notification: "Issue Status Updated"
- Shows old status → new status
```

**Step 4:** User B Sees It
```
Browser as User B:
1. Bell icon updates
2. Click bell 🔔
3. See: "Issue Status Updated"
   "TEST-1: moved to IN_PROGRESS"
```

**Step 5:** Verify in Database
```bash
db.notifications.findOne({
    type: "ISSUE_STATUS_CHANGED",
    recipient: ObjectId("userBId")
})

# Check fields:
# - description includes old and new status
# - metadata.oldStatus: "BACKLOG"
# - metadata.newStatus: "IN_PROGRESS"
```

---

## 📋 Test Case 3: Task Creation Notification

### Setup:
- You're logged in as any user
- Select 2-3 users to assign task to

### Test Steps:

**Step 1:** Navigate to Tasks
```
Click: Tasks → Create Task (or + button)
```

**Step 2:** Create Task
```
Form Fields:
- Title: "Test Task Notification"
- Description: "Testing notification system"
- Assignees: [Select User B and User C]
- Priority: Medium
- Due Date: Pick a date

Click: Create
```

**Step 3:** Verify Multiple Notifications
```
Expected Results:
- Task created successfully
- User B gets notification
- User C gets notification (separate notification)
- Both see: "New Task Assigned"
```

**Step 4:** Check Both Users
```
Open 2-3 browser windows as different users:
1. User B sees notification bell update
2. User C sees notification bell update
3. Both can click to see full details
```

**Step 5:** Database Check
```bash
# Should have 2 separate notifications
db.notifications.find({
    type: "TASK_ASSIGNED",
    description: "Test Task Notification"
}).pretty()

# Output should show 2 documents:
# 1. recipient: User B
# 2. recipient: User C
```

---

## 📋 Test Case 4: Meeting Scheduling Notification

### Setup:
- You're logged in as admin/manager
- Have 2-3 users available

### Test Steps:

**Step 1:** Navigate to Meetings
```
Click: Meetings → Schedule Meeting (or + button)
```

**Step 2:** Schedule Meeting
```
Form Fields:
- Title: "Test Meeting Notification"
- Description: "Testing notification system"
- Date/Time: Pick future date/time
- Duration: 60 minutes
- Participants: [Select User B, User C]
- Type: Google Meet

Click: Schedule
```

**Step 3:** Verify Notifications Sent
```
Expected Results:
- Meeting created successfully
- User B gets notification with Meet link
- User C gets notification with Meet link
- Both marked HIGH priority
```

**Step 4:** Check User Notifications
```
As User B:
1. Click bell 🔔
2. See: "Meeting Scheduled"
3. Description: "You're invited to: Test Meeting Notification"
4. Can see: Time, link, etc. in metadata

As User C:
1. Same as User B
```

**Step 5:** Database Verification
```bash
db.notifications.find({
    type: "MEETING_SCHEDULED",
    description: /Test Meeting/
}).pretty()

# Check fields:
# - priority: "high" (should be high for meetings)
# - metadata.meetLink contains valid URL
# - metadata.scheduledAt is future date
# - metadata.duration: 60
```

---

## 🎯 DevTools Verification

### Network Tab - WebSocket Check:
```
1. Open DevTools (F12)
2. Go to Network tab
3. Filter: WS (WebSocket)
4. Should see: ws://localhost:5000/socket.io
5. Status: 101 Switching Protocols ✓
```

### Console Tab - Check Logs:
```javascript
// You should see no red errors
// May see info logs:
// [socket.io] Connected
// [notification] Received...
```

### Application Tab - Storage:
```
1. Go to Cookies
2. Find: localStorage or cookies
3. Should have: JWT token with user info
4. Verify: Token contains your user ID
```

---

## ⚡ Real-Time Verification

### Multi-Window Test:
```
1. Open 3 browser windows
2. Window 1: Logged in as User A
3. Window 2: Logged in as User B  
4. Window 3: Logged in as User C

5. In Window 1: Create issue assigned to User B
6. Watch Window 2: Notification appears instantly ✓
7. In Window 1: Create task assigned to B and C
8. Watch Windows 2 & 3: Both get notifications ✓
9. In Window 1: Schedule meeting with B and C
10. Watch Windows 2 & 3: Both get meeting notification ✓
```

---

## 🔍 Debugging If Issues

### Issue: Notifications Not Appearing

**Check 1: WebSocket Connected?**
```javascript
// Browser console:
socket.connected  // Should be true
socket.id         // Should have value
```

**Check 2: Backend Logs**
```bash
# Terminal running backend should show:
User Connected: <socket-id>
Creating notification: {...}
```

**Check 3: Database Has Data?**
```bash
db.notifications.count()  # Should > 0
db.notifications.findOne()  # Should have data
```

**Check 4: API Endpoint Working?**
```bash
# Test manually:
curl -H "Authorization: Bearer <token>" \
  http://localhost:5000/api/notifications/feed
  
# Should return JSON array of notifications
```

---

## 📊 Expected Performance

### Time from Action to Notification:
- **Database Save:** < 50ms
- **WebSocket Emit:** < 10ms
- **Frontend Receive:** < 50ms
- **UI Update:** < 100ms
- **Total:** ~200ms (< 1 second) ✓

### Notification Storage:
- **Size per notification:** ~500 bytes
- **Monthly load:** ~1,000-5,000 notifications
- **Database requirement:** < 10MB for 6 months

---

## ✅ Test Completion Checklist

### Functionality Tests:
- [ ] Issue creation sends notification to assignee
- [ ] Issue status change sends notification
- [ ] Task creation sends notification to all assignees
- [ ] Meeting scheduling sends notification to all participants
- [ ] Multiple users receive separate notifications
- [ ] Unread badge shows correct count
- [ ] Can mark notification as read
- [ ] Can archive notification
- [ ] Notification shows correct timestamp
- [ ] Notification shows correct priority indicator

### Technical Tests:
- [ ] WebSocket connection established
- [ ] No console errors
- [ ] Database receives notification data
- [ ] API endpoints return correct data
- [ ] Multiple tabs in sync
- [ ] Works after browser refresh
- [ ] Works after network disconnect/reconnect
- [ ] Notifications persist in database

### UI Tests:
- [ ] Bell icon visible
- [ ] Badge shows unread count
- [ ] Dropdown displays properly
- [ ] Notification text is readable
- [ ] Timestamp displays correctly
- [ ] Icons show notification type
- [ ] Colors/styling look good
- [ ] Mobile responsive (if applicable)

---

## 🎉 Success Criteria

All tests pass when:
✅ Notifications appear instantly (< 1 second)
✅ Multiple recipients get notified
✅ Data persists in database
✅ UI updates in real-time
✅ No errors in console
✅ WebSocket stays connected
✅ Works across multiple browser windows

**If all boxes above checked: 🎉 SYSTEM WORKING PERFECTLY!**

---

## 🆘 Common Issues & Fixes

### Issue: "WebSocket connection failed"
**Fix:**
```bash
# Check backend is running
ps aux | grep node

# Check port 5000 is accessible
netstat -an | grep 5000

# Restart backend
cd backend && npm run dev
```

### Issue: "Notification appears but no content"
**Fix:**
```bash
# Check Notification model exists
ls backend/models/Notification.js

# Check notificationService exists
ls backend/services/notificationService.js

# Verify imports in controller
grep "Notification" backend/controllers/issueController.js
```

### Issue: "Multiple notifications for same action"
**Fix:**
```bash
# Check only one instance of backend running
killall node
npm run dev  # Start single instance
```

### Issue: "Notifications not persisting"
**Fix:**
```bash
# Verify MongoDB is running
mongo --eval "db.adminCommand('ping')"

# Check TTL index
db.notifications.getIndexes()
# Should see: { expiresAt: 1 }
```

---

## 📞 Need Help?

Check these files for reference:
1. `INTEGRATION_SUMMARY.md` - Overview of all changes
2. `NOTIFICATION_TRIGGERS_REFERENCE.md` - Detailed trigger info
3. `NOTIFICATION_VERIFICATION_GUIDE.md` - Verification steps
4. Backend logs: `npm run dev` output
5. Browser console: DevTools F12

---

## 🚀 You're Ready to Test!

Everything is integrated. Just:
1. Start backend
2. Start frontend
3. Create issues/tasks/meetings
4. Watch notifications appear instantly! 🔔

Enjoy your real-time notification system! ✨
