# ⏱️ Work Time Logging Feature - Complete Guide

## 📋 Overview

The Work Time Logging feature enables users to track time spent on tickets with both:
- **Timer-based logging** - Real-time time tracking with start/stop controls
- **Manual logging** - Enter start/end times for past work
- **Reporting & Analytics** - Track time by user, project, sprint, and ticket
- **Enterprise controls** - Approval workflow, audit trail, billable/non-billable tracking

## 🏗️ Architecture

### Database Model

```
WorkLog {
  _id: ObjectId
  workItemId: ObjectId (ref Task)
  userId: ObjectId (ref User)
  startTime: Date
  endTime: Date (null if timer running)
  durationMinutes: Number
  description: String
  logType: MANUAL | TIMER
  isTemporary: Boolean (true while timer running)
  status: RUNNING | STOPPED | FINALIZED | APPROVED
  approvedBy: ObjectId (admin/manager)
  approvedAt: Date
  billable: Boolean
  roundingRule: NONE | ROUND_5 | ROUND_15 | ROUND_30
  editedBy: [{userId, previousDuration, reason, editedAt}] // Audit trail
  tags: [String]
  createdAt: Date
  updatedAt: Date
}
```

### Key Constraints

- **One timer per user** - Starting a new timer stops any existing timer
- **No overlapping logs** - Cannot log overlapping time periods
- **Max 12 hours per entry** - Prevent invalid data entry
- **Immutable after approval** - Approved logs cannot be edited
- **Audit trail** - All edits recorded with reason and previous values

## 🔌 Backend APIs

### Timer Endpoints

#### Start Timer
```
POST /api/work-items/:id/work-logs/start
Authorization: Bearer {token}

Body: {
  description?: string
}

Response: {
  success: true,
  data: {
    _id: "log123",
    workItemId: "task456",
    userId: "user789",
    startTime: "2026-01-10T14:30:00Z",
    endTime: null,
    durationMinutes: 0,
    logType: "TIMER",
    isTemporary: true,
    status: "RUNNING"
  }
}
```

#### Stop Timer
```
POST /api/work-items/:id/work-logs/stop
Authorization: Bearer {token}

Response: {
  success: true,
  data: {
    ...log data with endTime and calculated durationMinutes
  }
}
```

### Manual Logging Endpoints

#### Create Manual Log
```
POST /api/work-items/:id/work-logs
Authorization: Bearer {token}

Body: {
  startTime: "2026-01-10T14:00:00Z",
  endTime: "2026-01-10T15:30:00Z",
  description: "Implemented feature X",
  billable: true,
  roundingRule: "ROUND_15",
  tags: ["feature", "frontend"]
}

Response: 201 Created
{
  success: true,
  data: { ...work log }
}
```

#### Get Work Logs
```
GET /api/work-items/:id/work-logs?userId=&status=&logType=&dateFrom=&dateTo=
Authorization: Bearer {token}

Response: {
  success: true,
  data: [...work logs],
  count: 5
}
```

#### Update Work Log
```
PATCH /api/work-logs/:id
Authorization: Bearer {token}

Body: {
  description: "Updated description",
  durationMinutes: 90,
  billable: false,
  reason: "Adjustment per manager request"
}

Response: {
  success: true,
  data: { ...updated work log with audit trail }
}
```

#### Delete Work Log
```
DELETE /api/work-logs/:id
Authorization: Bearer {token}

Response: {
  success: true,
  message: "Work log deleted"
}
```

### User Timer Endpoints

#### Get Running Timer
```
GET /api/users/me/timer
Authorization: Bearer {token}

Response: {
  success: true,
  data: {
    _id: "log123",
    workItemId: {...},
    startTime: "2026-01-10T14:30:00Z",
    displayDuration: 45 // calculated minutes elapsed
  } // or null if no running timer
}
```

#### Stop All Timers
```
POST /api/users/me/timers/stop
Authorization: Bearer {token}

Response: {
  success: true,
  data: [...stopped timers],
  count: 1,
  message: "Stopped 1 timer(s)"
}
```

### Reporting Endpoints

#### Get Time Summary for Ticket
```
GET /api/work-items/:id/time-summary
Authorization: Bearer {token}

Response: {
  success: true,
  data: {
    workItemId: "task123",
    issueKey: "PROJ-123",
    totalMinutes: 300,
    totalHours: 5,
    billableMinutes: 250,
    billableHours: 4.17,
    logCount: 3,
    byUser: [
      {
        userId: "user789",
        userName: "John Doe",
        totalMinutes: 300,
        logCount: 3
      }
    ],
    averagePerLog: 100
  }
}
```

#### Get Time Reports
```
GET /api/reports/time?type=USER&userId=user789&startDate=&endDate=
GET /api/reports/time?type=PROJECT&projectId=proj123&startDate=&endDate=
GET /api/reports/time?type=SPRINT&sprintId=sprint123
GET /api/reports/time?type=DASHBOARD&projectId=proj123&days=7

Response: {
  success: true,
  data: {
    // Varies by report type
    // See examples below
  }
}
```

**User Report Response:**
```json
{
  "userId": "user789",
  "startDate": "2026-01-03",
  "endDate": "2026-01-10",
  "totalMinutes": 1200,
  "totalHours": 20,
  "billableMinutes": 1050,
  "billableHours": 17.5,
  "logCount": 12,
  "byDay": {
    "2026-01-10": {
      "totalMinutes": 480,
      "logCount": 2,
      "logs": [...]
    }
  }
}
```

**Project Report Response:**
```json
{
  "projectId": "proj123",
  "totalMinutes": 5400,
  "totalHours": 90,
  "billableMinutes": 4800,
  "billableHours": 80,
  "logCount": 50,
  "userCount": 5,
  "ticketCount": 12,
  "topUsers": [
    {
      "userId": "user1",
      "userName": "John",
      "totalMinutes": 1200,
      "logCount": 10
    }
  ],
  "topTickets": [
    {
      "ticketId": "task1",
      "issueKey": "PROJ-101",
      "title": "Implement auth",
      "totalMinutes": 600
    }
  ]
}
```

**Sprint Report Response:**
```json
{
  "sprintId": "sprint123",
  "totalMinutes": 2400,
  "totalHours": 40,
  "logCount": 20,
  "ticketCount": 8,
  "byStatus": [
    {
      "status": "done",
      "totalMinutes": 1200,
      "logCount": 10
    }
  ],
  "byUser": [...]
}
```

## 💻 Frontend Components

### TimerWidget
**Location:** `frontend/src/components/work-logs/TimerWidget.jsx`

Floating widget that displays:
- Running timer with elapsed time
- Current work item being timed
- Switch and Stop buttons

**Props:** None (uses TimerContext)

**Example:**
```jsx
<TimerWidget />
```

### WorkLogPanel
**Location:** `frontend/src/components/work-logs/WorkLogPanel.jsx`

Main work logging UI for ticket detail view. Shows:
- Timer controls (Start/Stop)
- Manual log button
- Time summary with user breakdown
- Work log history

**Props:**
```jsx
<WorkLogPanel 
  workItemId="task123"
  onTimeUpdated={(summary) => console.log(summary)}
/>
```

### LogWorkModal
**Location:** `frontend/src/components/work-logs/LogWorkModal.jsx`

Modal for manually entering work time:
- Start/end time picker
- Description input
- Billable checkbox
- Rounding rule selector

**Props:**
```jsx
<LogWorkModal
  workItemId="task123"
  onClose={() => setShowModal(false)}
  onCreated={() => loadWorkLogs()}
/>
```

### WorkLogList
**Location:** `frontend/src/components/work-logs/WorkLogList.jsx`

Displays list of work logs with:
- Duration, type (timer/manual), status badges
- User and timestamp
- Delete and edit buttons
- Billable indicator

**Props:**
```jsx
<WorkLogList
  logs={workLogs}
  onDeleted={() => loadWorkLogs()}
  onEdited={() => loadWorkLogs()}
/>
```

## 🎯 Hooks & Context

### useTimer Hook
**Location:** `frontend/src/hooks/useTimer.js`

Manages local timer state:
```jsx
const {
  startTime,
  isRunning,
  elapsedSeconds,
  formattedTime,      // "HH:MM:SS"
  start,
  stop,
  reset,
  getMinutes
} = useTimer();
```

### TimerContext
**Location:** `frontend/src/context/TimerContext.jsx`

Global timer state management:
```jsx
const {
  runningTimer,        // Current running timer or null
  loading,
  error,
  startTimer,          // async (workItemId, description)
  stopTimer,           // async (workItemId)
  pauseTimer,          // async ()
  stopAllTimers,       // async ()
  isTimerRunning,      // boolean
  currentWorkItemId    // string or null
} = useTimerContext();
```

**Usage:**
```jsx
import { TimerProvider } from './context/TimerContext';

// In App.jsx
<TimerProvider>
  <YourApp />
</TimerProvider>
```

## 📊 Business Logic

### Timer Rules

1. **One timer per user**
   - Starting a new timer automatically stops existing timer
   - User warned before closing tab with active timer

2. **Auto-stop on status change**
   - Timer auto-stops when ticket moves to "Done"
   - User notified with remaining time

3. **Time rounding**
   - Configurable: None, Round 5 min, 15 min, 30 min
   - Applied on manual logs and timer stop

### Validation Rules

```javascript
// Start Time
- Must be before end time
- Cannot create overlapping logs for same user

// End Time
- Must be after start time
- Cannot be in future for manual logs

// Duration
- Min: 1 minute
- Max: 12 hours per entry
- Total per day: No limit (but recommended < 12)

// Overlapping Check
- Queries database for conflicts
- Prevents double-counting time
```

### Audit Trail

Every edit records:
```javascript
{
  userId: "editor123",           // Who made the change
  previousDuration: 60,          // Before value
  previousDescription: "old",    // Before value
  editedAt: "2026-01-10T15:00Z", // When
  reason: "Adjustment per review" // Why
}
```

## 🔒 Permissions

| Action | Owner | Manager | Admin | Others |
|--------|-------|---------|-------|--------|
| Start timer | ✅ | ✅ | ✅ | ✅ |
| Log manual time | ✅ | ✅ | ✅ | ✅ |
| Edit own log | ✅ | ✅ | ✅ | ❌ |
| Delete own log | ✅ | ✅ | ✅ | ❌ |
| Edit others' logs | ❌ | ✅ | ✅ | ❌ |
| Delete others' logs | ❌ | ✅ | ✅ | ❌ |
| View all reports | ❌ | ✅ | ✅ | ❌ |
| Approve logs | ❌ | ✅ | ✅ | ❌ |

## 📈 Performance

### Indexes for Speed
```javascript
// Single field indexes
{ workItemId: 1 }
{ userId: 1 }
{ isTemporary: 1 }
{ status: 1 }
{ createdAt: 1 }

// Compound indexes
{ workItemId: 1, userId: 1 }
{ workItemId: 1, createdAt: -1 }
{ workItemId: 1, createdAt: -1, status: 1 }
```

### Query Optimization
- Paginate large result sets
- Use lean() for read-only queries
- Cache daily aggregations
- Background job cleans orphaned logs every 24h

## 🧪 Testing

### Unit Tests
```javascript
// Test timer start
test('Starting timer stops existing timer', async () => {
  const timer1 = await workLogService.startTimer('task1', 'user1');
  const timer2 = await workLogService.startTimer('task2', 'user1');
  
  expect(timer1.status).toBe('STOPPED');
  expect(timer2.status).toBe('RUNNING');
});

// Test validation
test('Prevents overlapping logs', async () => {
  await workLogService.createManualLog('task1', 'user1', 
    '2026-01-10T14:00Z', '2026-01-10T15:00Z');
  
  await expect(() => 
    workLogService.createManualLog('task1', 'user1',
      '2026-01-10T14:30Z', '2026-01-10T15:30Z')
  ).rejects.toThrow('Cannot overlap');
});
```

### Integration Tests
```javascript
// Test complete workflow
test('Complete timer workflow', async () => {
  // Start timer
  const started = await api.post('/work-items/task1/work-logs/start');
  expect(started.data.data.status).toBe('RUNNING');
  
  // Stop timer
  const stopped = await api.post('/work-items/task1/work-logs/stop');
  expect(stopped.data.data.durationMinutes).toBeGreaterThan(0);
  
  // Get summary
  const summary = await api.get('/work-items/task1/time-summary');
  expect(summary.data.data.logCount).toBe(1);
});
```

## 🚀 Deployment Checklist

- [ ] Run migrations to create WorkLog collection
- [ ] Create indexes in production database
- [ ] Deploy backend services and routes
- [ ] Deploy frontend components
- [ ] Update main dashboard to include TimerWidget
- [ ] Add WorkLogPanel to ticket detail page
- [ ] Test timer functionality
- [ ] Test manual logging
- [ ] Test reporting endpoints
- [ ] Monitor database performance
- [ ] Setup background job for cleanup

## 📝 Configuration

```env
# .env backend
# Max duration per entry (minutes)
MAX_LOG_DURATION=720  # 12 hours

# Default rounding rule
DEFAULT_ROUNDING=NONE

# Auto-cleanup orphaned logs older than N hours
CLEANUP_ORPHANED_HOURS=24

# Enable approval workflow
ENABLE_APPROVAL=false

# Billable by default
DEFAULT_BILLABLE=true
```

## 🐛 Common Issues

### Timer Won't Stop
**Solution:** Check browser console for API errors. Ensure user has internet connection.

### Overlapping Logs Error
**Solution:** Check existing logs with `GET /work-items/:id/work-logs`. Delete conflicting logs.

### Time Rounded Incorrectly
**Solution:** Verify rounding rule in work log. Update if needed with PATCH endpoint.

### Reports Show Wrong Data
**Solution:** Clear browser cache. Verify date range filter. Check if logs are in "STOPPED" status.

## 🤝 Integration Examples

### Add to Ticket Detail Page
```jsx
import WorkLogPanel from './components/work-logs/WorkLogPanel';

function TicketDetail({ ticketId }) {
  return (
    <div>
      <TicketHeader {...} />
      <TicketBody {...} />
      <WorkLogPanel workItemId={ticketId} />
    </div>
  );
}
```

### Add Timer Widget to Layout
```jsx
import TimerWidget from './components/work-logs/TimerWidget';
import { TimerProvider } from './context/TimerContext';

function App() {
  return (
    <TimerProvider>
      <Layout>
        <Router>...</Router>
        <TimerWidget />
      </Layout>
    </TimerProvider>
  );
}
```

### Get Time Report in Dashboard
```jsx
import workLogService from './services/workLogService';

function DashboardPage({ projectId }) {
  const [report, setReport] = useState(null);
  
  useEffect(() => {
    workLogService.getDashboardSummary(projectId, 7)
      .then(setReport);
  }, [projectId]);
  
  return <TimeReportChart data={report} />;
}
```

---

**Last Updated:** January 10, 2026  
**Status:** Production Ready ✅  
**Version:** 1.0.0
