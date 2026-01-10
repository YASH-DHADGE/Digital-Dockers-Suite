# ⏱️ Work Time Logging - Quick Reference

## 🚀 Get Started in 5 Minutes

### Backend Setup
```bash
# 1. Add routes to server.js
app.use('/api/work-items', require('./routes/workLogRoutes'));
app.use('/api/work-logs', require('./routes/workLogRoutes'));
app.use('/api/users', require('./routes/workLogRoutes'));
app.use('/api/reports', require('./routes/workLogRoutes'));

# 2. Run backend
npm run dev
```

### Frontend Setup
```jsx
// 1. Wrap app with TimerProvider
<TimerProvider>
  <App />
</TimerProvider>

// 2. Add timer widget
<TimerWidget />

// 3. Add to ticket page
<WorkLogPanel workItemId={ticketId} />

// 4. Done! Start using
```

## 📡 API Quick Commands

### Start Timer
```bash
curl -X POST http://localhost:5000/api/work-items/task123/work-logs/start \
  -H "Authorization: Bearer TOKEN"
```

### Stop Timer
```bash
curl -X POST http://localhost:5000/api/work-items/task123/work-logs/stop \
  -H "Authorization: Bearer TOKEN"
```

### Log Time Manually
```bash
curl -X POST http://localhost:5000/api/work-items/task123/work-logs \
  -H "Authorization: Bearer TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "startTime": "2026-01-10T14:00:00Z",
    "endTime": "2026-01-10T15:00:00Z",
    "description": "Fixed bug"
  }'
```

### Get Time Summary
```bash
curl http://localhost:5000/api/work-items/task123/time-summary \
  -H "Authorization: Bearer TOKEN"
```

### Generate Report
```bash
curl 'http://localhost:5000/api/reports/time?type=user&days=7' \
  -H "Authorization: Bearer TOKEN"
```

## 🎯 Component Usage

### Timer Context
```jsx
const { runningTimer, startTimer, stopTimer } = useTimerContext();

// Start timer
await startTimer(workItemId, 'Working on feature');

// Stop timer
await stopTimer(workItemId);
```

### Work Log Service
```jsx
import workLogService from './services/workLogService';

// Manual log
await workLogService.createManualLog(workItemId, {
  startTime: '2026-01-10T14:00:00Z',
  endTime: '2026-01-10T15:00:00Z',
  description: 'Feature work'
});

// Get summary
const summary = await workLogService.getTimeSummary(workItemId);
```

## 📊 Report Types

```javascript
// User report (last 7 days)
GET /api/reports/time?type=user&days=7

// Project report (last 30 days)
GET /api/reports/time?type=project&projectId=proj123&startDate=&endDate=

// Sprint report
GET /api/reports/time?type=sprint&sprintId=sprint123

// Dashboard summary (7 days)
GET /api/reports/time?type=dashboard&projectId=proj123&days=7
```

## 🔑 Key Features

| Feature | Code | Result |
|---------|------|--------|
| Start Timer | `startTimer(id)` | Timer runs, visible widget |
| Stop Timer | `stopTimer(id)` | Time saved, duration calculated |
| Manual Log | `createManualLog(id, {start, end})` | Historical time logged |
| Get Summary | `getTimeSummary(id)` | Total time by user |
| Reports | `getProjectReport(id)` | Analytics dashboard |

## ⚙️ Configuration

```env
# .env backend
MAX_LOG_DURATION=720        # Max 12 hours
DEFAULT_ROUNDING=NONE       # No rounding by default
CLEANUP_ORPHANED_HOURS=24   # Clean old temp logs
ENABLE_APPROVAL=false       # Approval workflow
DEFAULT_BILLABLE=true       # Logs are billable
```

## 🐛 Troubleshooting

| Issue | Solution |
|-------|----------|
| Timer won't start | Check auth token validity |
| Overlapping error | Delete conflicting logs |
| Time shows 0 | Ensure timer was stopped |
| No logs appear | Check filters, verify stop status |

## 📁 Files Reference

| File | Purpose | Lines |
|------|---------|-------|
| `WorkLog.js` | Database model | 400 |
| `workLogService.js` | Business logic | 500 |
| `timeReportingService.js` | Analytics | 400 |
| `workLogController.js` | API handlers | 300 |
| `workLogRoutes.js` | API routes | 60 |
| `TimerWidget.jsx` | Floating timer | 100 |
| `WorkLogPanel.jsx` | Main UI | 200 |
| `WorkLogList.jsx` | History list | 150 |
| `LogWorkModal.jsx` | Manual entry | 200 |
| `WorkLogs.css` | Styling | 700 |

## 🔐 Permissions

| Action | Owner | Manager | Admin |
|--------|-------|---------|-------|
| Log time | ✅ | ✅ | ✅ |
| Edit own log | ✅ | ✅ | ✅ |
| Edit others | ❌ | ✅ | ✅ |
| View reports | ❌ | ✅ | ✅ |
| Approve logs | ❌ | ✅ | ✅ |

## 💡 Tips

- ⏱️ Only one timer runs per user (auto-switches)
- 📱 Mobile-friendly responsive design
- 🌙 Dark mode fully supported
- 🔄 Auto-refreshes every 10 seconds when timer active
- ⚠️ Warns before closing page with active timer
- 🎯 Auto-stops timer when ticket marked Done

## 📚 Documentation

- **Full Guide:** `WORK_TIME_LOGGING_GUIDE.md`
- **Integration:** `WORK_TIME_LOGGING_INTEGRATION.md`
- **Summary:** `WORK_TIME_LOGGING_SUMMARY.md`
- **Deliverables:** `WORK_TIME_LOGGING_DELIVERABLES.md`

## ✅ Testing Checklist

- [ ] Start timer on a ticket
- [ ] See floating widget with elapsed time
- [ ] Switch to different task (timer pauses)
- [ ] Stop timer and verify time logged
- [ ] Log time manually
- [ ] View time summary
- [ ] Check work log list
- [ ] Generate project report
- [ ] Test on mobile view
- [ ] Test dark mode

## 🎬 Quick Start Flow

1. **User clicks ticket** → See WorkLogPanel
2. **Click "Start Timer"** → TimerWidget appears bottom-right
3. **Continue working** → Widget shows elapsed time
4. **Click "Stop"** → Time saved to database
5. **See summary** → Total time and breakdown
6. **Generate report** → View project-wide analytics

---

**Quick Reference Created:** January 10, 2026  
**Status:** Ready to Use ✅  
**Need Help?** See full documentation files
