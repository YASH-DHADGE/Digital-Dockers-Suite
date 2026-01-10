# 🚀 Quick Start - Sub-Tasks Feature

## Installation & Setup

### ✅ Already Done For You

The feature is **fully implemented and integrated** into the database. No additional setup needed!

### Verify Installation

1. **Backend Routes Active:**
   ```bash
   GET  /api/sprints/:sprintId/burndown
   POST /api/work-items/:parentId/subtasks
   GET  /api/work-items/:parentId/subtasks
   PATCH /api/work-items/:childId/status
   DELETE /api/work-items/:childId
   ```

2. **Database Schema Updated:**
   - Task model has parent-child support
   - ActivityLog tracks subtask operations
   - Indexes created for performance

3. **Frontend Components Deployed:**
   - SubTaskPanel.jsx
   - SubTaskCreationModal.jsx
   - SprintBurndownChart.jsx
   - Enhanced StatusOverview.jsx

---

## 📖 How to Use

### On Any Work Item Detail Page

```jsx
import SubTaskPanel from '../components/SubTaskPanel';

export default function WorkItemDetail() {
  const [task, setTask] = useState(taskData);

  return (
    <div>
      <h1>{task.title}</h1>
      <p>{task.description}</p>
      
      {/* Add the SubTaskPanel */}
      <SubTaskPanel 
        parentTaskId={task._id}
        parentTask={task}
        onTaskUpdate={(updatedParent) => {
          setTask(updatedParent);
        }}
      />
    </div>
  );
}
```

### Create a Sub-Task

1. **Click "Add Sub-Task" button** in SubTaskPanel
2. **Fill in the modal:**
   - Title (required)
   - Description (optional)
   - Story Points (0-100)
   - Priority (Low/Medium/High/Critical)
   - Assign To (optional)
   - Due Date (optional)
3. **Click "Create Sub-Task"**
4. SubTaskPanel auto-refreshes and shows new child

### Update Sub-Task Status

1. **Find the sub-task** in the SubTaskPanel list
2. **Click the status dropdown**
3. **Select new status:**
   - To Do
   - In Progress
   - In Review
   - Done
4. **Parent status auto-updates** based on children

### View Sprint Burndown

```jsx
import SprintBurndownChart from '../components/charts/SprintBurndownChart';

export default function SprintDashboard() {
  return (
    <SprintBurndownChart
      sprintId={activeSprint._id}
      sprintName={activeSprint.name}
    />
  );
}
```

The chart will show:
- ✅ Ideal burndown line (dashed)
- ✅ Actual remaining points (colored)
- ✅ Health status (On Track / At Risk)
- ✅ Velocity trend (Improving/Worsening/Stable)
- ✅ Forecast completion date

---

## 🎯 Feature Highlights

### Smart Parent Status Updates

When you update a child task status, the parent **automatically updates**:

```
Parent Status Logic:
├─ All children DONE?        → Parent = Done ✅
├─ Any child IN_PROGRESS?    → Parent = In Progress 🔄
├─ Any child IN_REVIEW?      → Parent = In Review 👀
└─ Otherwise?                → Parent = To Do 📋
```

### Story Points Auto-Calculation

Parent automatically shows:
- **Own points** - Parent's individual points
- **Children points** - Sum of all children's points
- **Total points** - Own + Children

### Constraints & Safety

The system **prevents invalid configurations**:
- ❌ Epics cannot have children
- ❌ Cannot nest deeper than 1 level (parent → child only)
- ❌ Subtasks require a parent
- ❌ Cannot orphan children when deleting parent

---

## 📊 Viewing Status Overview

The StatusOverview component now shows:

```
┌─────────────────────────────────────────┐
│  📊 Status Overview                     │
├─────────────────────────────────────────┤
│  Sprint Completion: 75%  [████████░░]   │
│                                         │
│  Status Breakdown:                      │
│  ✅ Done (5)         📋 Backlog (8)    │
│  🔄 In Progress (3)  👀 In Review (2)  │
│                                         │
│  Chart: Pie chart showing distribution │
└─────────────────────────────────────────┘
```

---

## 🛠️ API Reference

### Create Sub-Task

```bash
POST /api/work-items/:parentId/subtasks

Request:
{
  "title": "Fix authentication bug",
  "description": "Login form not working with SSO",
  "storyPoints": 5,
  "priority": "high",
  "assignedTo": "userId123",
  "dueDate": "2026-01-15"
}

Response:
{
  "success": true,
  "data": {
    "_id": "subtask123",
    "title": "Fix authentication bug",
    "parentTask": "parent123",
    "issueType": "subtask",
    "status": "todo",
    "storyPoints": 5,
    "issueKey": "PROJ-101"
  }
}
```

### Get Children

```bash
GET /api/work-items/:parentId/subtasks?skip=0&limit=50&status=todo

Response:
{
  "success": true,
  "children": [...],
  "total": 5,
  "skip": 0,
  "limit": 50,
  "hasMore": false
}
```

### Update Status

```bash
PATCH /api/work-items/:childId/status

Request:
{ "status": "in_progress" }

Response:
{
  "success": true,
  "child": { ... },
  "parent": { ... }  // Updated parent
}
```

### Get Burndown

```bash
GET /api/sprints/:sprintId/burndown

Response:
{
  "success": true,
  "data": {
    "labels": ["Day 1", "Day 2", ...],
    "ideal": [20, 18, 16, ...],
    "actual": [20, 19, 17, ...],
    "committedPoints": 20,
    "currentRemaining": 4,
    "health": "healthy",
    "trend": "improving",
    "forecast": {
      "avgBurnPerDay": 2.5,
      "daysNeeded": 2,
      "willCompleteOnTime": true
    }
  }
}
```

---

## ⚡ Performance Notes

### Query Optimization
- Uses database indexes for fast lookups
- Pagination prevents loading all children
- Aggregation pipeline for story points

### Frontend Optimization
- Loads children only when expanded
- Efficient state updates
- CSS animations (GPU accelerated)

### Expected Load Times
- Create subtask: < 200ms
- List children: < 300ms
- Update status: < 200ms
- Get burndown: < 500ms

---

## 🐛 Troubleshooting

### Sub-task not appearing?
1. Check browser console for errors
2. Verify parent task ID is correct
3. Ensure you're authenticated
4. Check network tab for API response

### Parent status not updating?
1. Refresh the page
2. Check all children statuses
3. Verify parent is not an epic
4. Check activity log for errors

### Burndown chart not showing?
1. Ensure sprint is active
2. Check sprint has tasks assigned
3. Verify sprint dates are set correctly
4. Check browser console for errors

### "Cannot nest deeper" error?
This is intentional! The system prevents:
- Parent → Child → Grandchild (not allowed)
- Only 1 level of nesting is supported

---

## 📚 Integration Examples

### Example 1: Task Board with Sub-Tasks

```jsx
import { useState, useEffect } from 'react';
import SubTaskPanel from '../components/SubTaskPanel';
import axios from 'axios';

export default function TaskBoard() {
  const [tasks, setTasks] = useState([]);

  useEffect(() => {
    loadTasks();
  }, []);

  const loadTasks = async () => {
    const res = await axios.get('/api/tasks/');
    setTasks(res.data);
  };

  return (
    <div>
      {tasks.map(task => (
        <div key={task._id}>
          <h3>{task.title}</h3>
          <SubTaskPanel
            parentTaskId={task._id}
            parentTask={task}
            onTaskUpdate={(updated) => {
              setTasks(prev => prev.map(t => 
                t._id === updated._id ? updated : t
              ));
            }}
          />
        </div>
      ))}
    </div>
  );
}
```

### Example 2: Sprint Dashboard with Burndown

```jsx
import { useState, useEffect } from 'react';
import SprintBurndownChart from '../components/charts/SprintBurndownChart';
import StatusOverview from '../components/dashboards/StatusOverview';

export default function SprintDashboard() {
  const [sprint, setSprint] = useState(null);
  const [stats, setStats] = useState(null);

  useEffect(() => {
    loadSprintData();
  }, []);

  const loadSprintData = async () => {
    const sprints = await axios.get('/api/sprints/');
    const activeSprint = sprints.data.find(s => s.status === 'active');
    setSprint(activeSprint);

    const projectStats = await axios.get('/api/projects/stats');
    setStats(projectStats.data);
  };

  return (
    <div>
      {sprint && <SprintBurndownChart sprintId={sprint._id} />}
      {stats && <StatusOverview stats={stats} />}
    </div>
  );
}
```

---

## ✅ Checklist for Using Sub-Tasks

- [x] Backend endpoints deployed
- [x] Database schema updated
- [x] React components created
- [x] Components styled with CSS
- [x] Parent-child relationships working
- [x] Status auto-update working
- [x] Story points aggregation working
- [x] Burndown chart working
- [x] Activity logging working
- [x] Error handling in place
- [x] Validation enforced
- [x] Responsive design working

**Everything is ready to use! Start adding sub-tasks to your work items! 🎉**

---

## 🎓 Learning Resources

### Understanding Parent-Child Logic

The system uses a simple but powerful pattern:
1. **Parent contains children** (one-to-many relationship)
2. **Parent status derives from children** (not set directly)
3. **Deleting parent prevents orphaning** (safety check)
4. **Story points aggregate** (parent = own + sum of children)

### Understanding Burndown

Burndown charts show:
- **Ideal line**: What should be done (linear)
- **Actual line**: What IS done (real data)
- **Gap**: Difference between plan and reality
- **Trend**: Getting better? Worse? Stable?

### Database Design

The Task model uses:
- **References**: parentTask field links to another Task
- **Validation**: Async validators prevent bad states
- **Indexes**: Speed up common queries
- **Middleware**: Pre-save hooks enforce rules

---

**Ready to go! 🚀 Start creating sub-tasks!**
