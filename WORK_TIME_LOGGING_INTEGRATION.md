# 🔗 Work Time Logging - Integration Checklist

## Backend Integration Steps

### 1. Register Routes in server.js

```javascript
// backend/server.js - Add after other route registrations

// Work Log Routes
app.use('/api/work-items', require('./routes/workLogRoutes'));
app.use('/api/work-logs', require('./routes/workLogRoutes'));
app.use('/api/users', require('./routes/workLogRoutes'));
app.use('/api/reports', require('./routes/workLogRoutes'));
```

**Location:** Around line 85-120 where other routes are registered

### 2. Add WorkLog Reference to Task Model

```javascript
// backend/models/Task.js - Add to schema

workLogs: [{
  type: mongoose.Schema.Types.ObjectId,
  ref: 'WorkLog'
}],

// Add virtual for total time
const taskSchema = new mongoose.Schema({
  // ... existing fields ...
  totalTimeSpent: {
    type: Number,
    default: 0,
    min: 0  // minutes
  },
  timeSpentHours: {
    type: Number,
    default: 0
  }
});
```

### 3. Database Indexes

Run these commands in MongoDB to create indexes:

```javascript
// Create indexes for performance
db.worklogs.createIndex({ workItemId: 1, createdAt: -1 });
db.worklogs.createIndex({ userId: 1, createdAt: -1 });
db.worklogs.createIndex({ workItemId: 1, userId: 1 });
db.worklogs.createIndex({ isTemporary: 1, status: 1 });
db.worklogs.createIndex({ 
  workItemId: 1, 
  createdAt: -1,
  status: 1
});
```

### 4. Environment Variables

Add to `.env`:

```env
# Work Logging Configuration
MAX_LOG_DURATION=720          # Max 12 hours per entry
DEFAULT_ROUNDING=NONE         # NONE, ROUND_5, ROUND_15, ROUND_30
CLEANUP_ORPHANED_HOURS=24     # Hours before cleaning orphaned temp logs
ENABLE_APPROVAL=false         # Enable manager approval workflow
DEFAULT_BILLABLE=true         # Logs are billable by default
```

### 5. Optional: Background Job for Cleanup

Add to `backend/scripts/cleanup.js`:

```javascript
const workLogService = require('../services/workLogService');

setInterval(async () => {
  try {
    const cleaned = await workLogService.cleanupOrphanedLogs(24);
    console.log(`Cleaned ${cleaned} orphaned work logs`);
  } catch (error) {
    console.error('Cleanup failed:', error);
  }
}, 24 * 60 * 60 * 1000); // Run every 24 hours
```

Then in `package.json`:

```json
{
  "scripts": {
    "start": "node backend/server.js",
    "dev": "nodemon backend/server.js",
    "cleanup": "node backend/scripts/cleanup.js"
  }
}
```

---

## Frontend Integration Steps

### 1. Add Timer Provider to App Root

```jsx
// frontend/src/main.jsx or frontend/src/index.jsx

import { TimerProvider } from './context/TimerContext';

const root = createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <TimerProvider>
      <App />
    </TimerProvider>
  </React.StrictMode>
);
```

### 2. Add Timer Widget to Layout

```jsx
// frontend/src/App.jsx or main Layout component

import TimerWidget from './components/work-logs/TimerWidget';

function App() {
  return (
    <Layout>
      <Routes>
        {/* ... routes ... */}
      </Routes>
      <TimerWidget /> {/* Add at the end */}
    </Layout>
  );
}
```

### 3. Add WorkLogPanel to Ticket Detail

```jsx
// frontend/src/pages/TicketDetail.jsx

import WorkLogPanel from '../components/work-logs/WorkLogPanel';

function TicketDetail({ ticketId }) {
  return (
    <div className="ticket-detail">
      <TicketHeader {...} />
      <TicketDescription {...} />
      <SubTaskPanel {...} />
      
      {/* Add work log panel */}
      <WorkLogPanel 
        workItemId={ticketId}
        onTimeUpdated={(summary) => {
          // Update UI with time info if needed
        }}
      />
    </div>
  );
}
```

### 4. Import CSS

```jsx
// In your main CSS or component file
import './components/work-logs/WorkLogs.css';
```

### 5. Update Imports in Components

Ensure these imports work:

```javascript
// These should resolve correctly
import { useTimerContext } from '@/context/TimerContext';
import workLogService from '@/services/workLogService';
import { useTimer } from '@/hooks/useTimer';
```

---

## API Integration Examples

### Start Timer on Ticket
```javascript
// Click handler example
const handleStartWork = async () => {
  try {
    const result = await workLogService.startTimer(ticketId, 'Working on feature');
    console.log('Timer started:', result.data);
  } catch (error) {
    console.error('Failed:', error);
  }
};
```

### Get Time Summary
```javascript
// Load summary after work is done
const loadTimeSummary = async () => {
  try {
    const summary = await workLogService.getTimeSummary(ticketId);
    setTimeInfo(summary.data);
  } catch (error) {
    console.error('Failed:', error);
  }
};
```

### Generate Report
```javascript
// Generate project report for last 30 days
const generateReport = async (projectId) => {
  try {
    const report = await workLogService.getProjectReport(
      projectId,
      new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
      new Date()
    );
    
    console.log(`Total hours: ${report.data.totalHours}`);
    console.log(`Top users:`, report.data.topUsers);
  } catch (error) {
    console.error('Failed:', error);
  }
};
```

---

## Testing the Feature

### 1. Start Timer
```bash
curl -X POST http://localhost:5000/api/work-items/task123/work-logs/start \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"description":"Testing timer"}'
```

### 2. Get Running Timer
```bash
curl http://localhost:5000/api/users/me/timer \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### 3. Stop Timer
```bash
curl -X POST http://localhost:5000/api/work-items/task123/work-logs/stop \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### 4. Create Manual Log
```bash
curl -X POST http://localhost:5000/api/work-items/task123/work-logs \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "startTime": "2026-01-10T14:00:00Z",
    "endTime": "2026-01-10T15:30:00Z",
    "description": "Fixed bug",
    "billable": true
  }'
```

### 5. Get Time Summary
```bash
curl http://localhost:5000/api/work-items/task123/time-summary \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### 6. Generate Report
```bash
curl 'http://localhost:5000/api/reports/time?type=user&days=7' \
  -H "Authorization: Bearer YOUR_TOKEN"
```

---

## File Checklist

### Backend Files Created
- ✅ `backend/models/WorkLog.js` (400+ lines)
- ✅ `backend/services/workLogService.js` (500+ lines)
- ✅ `backend/services/timeReportingService.js` (400+ lines)
- ✅ `backend/controllers/workLogController.js` (300+ lines)
- ✅ `backend/routes/workLogRoutes.js` (50 lines)

### Frontend Files Created
- ✅ `frontend/src/hooks/useTimer.js` (70 lines)
- ✅ `frontend/src/context/TimerContext.jsx` (150 lines)
- ✅ `frontend/src/services/workLogService.js` (150 lines)
- ✅ `frontend/src/components/work-logs/TimerWidget.jsx` (100 lines)
- ✅ `frontend/src/components/work-logs/WorkLogPanel.jsx` (200 lines)
- ✅ `frontend/src/components/work-logs/WorkLogList.jsx` (150 lines)
- ✅ `frontend/src/components/work-logs/LogWorkModal.jsx` (200 lines)
- ✅ `frontend/src/components/work-logs/WorkLogs.css` (700+ lines)

### Documentation Files
- ✅ `WORK_TIME_LOGGING_GUIDE.md` (Comprehensive guide)

---

## Deployment Order

1. ✅ Create WorkLog model in MongoDB
2. ✅ Deploy backend services
3. ✅ Deploy backend routes
4. ✅ Register routes in server.js
5. ✅ Deploy frontend services and hooks
6. ✅ Deploy frontend context
7. ✅ Deploy frontend components
8. ✅ Update App root with TimerProvider
9. ✅ Add TimerWidget to main layout
10. ✅ Add WorkLogPanel to ticket detail page
11. ✅ Test end-to-end
12. ✅ Monitor performance

---

## Quick Start (Development)

### Backend
```bash
cd backend
npm install  # If needed
npm run dev
```

### Frontend
```bash
cd frontend
npm install  # If needed
npm run dev
```

### Test Flow
1. Open http://localhost:3000 in browser
2. Navigate to a ticket
3. Click "Start Timer"
4. See floating timer widget
5. Click "Stop Timer" to save
6. Verify work log appears in WorkLogPanel

---

## Performance Considerations

- Timer context updates every 1 second (configurable)
- Work logs fetched on component mount and when timer changes
- Time summaries cached on frontend
- Reporting endpoints use aggregation pipeline for efficiency
- Background job cleans orphaned logs daily

## Future Enhancements

- Drag-and-drop timer to different task
- Time tracking by project/sprint
- Mobile app support
- Automated timesheet generation
- Integration with billing system
- Slack notifications for timer
- Calendar view of logged time

---

**Integration Complete!** ✅

All files are ready. Follow the steps above to integrate into your application.

For questions, refer to `WORK_TIME_LOGGING_GUIDE.md`
