# Sprint Dashboard Issue Creation Fix

## Problem
When creating an issue and assigning it to a sprint (e.g., Sprint 5), the system showed "successful" but the issue didn't appear in the sprint dashboard.

## Root Causes Identified & Fixed

### 1. **ScrumBoard Sprint Field Mismatch**
**File:** `frontend/src/components/tasks/ScrumBoard.jsx`

**Issue:** The code was checking `task.sprintId` which doesn't exist. The backend API returns `task.sprint` as an object (populated with `_id`, `name`, `status`).

**Fix:** Updated the `loadSprintTasks()` function to use the new API method `getTasksBySprint()` which properly filters by sprint ID at the API level.

```javascript
// BEFORE - Incorrect field check
const sprintTasks = allTasks.filter(
    task => task.sprintId === selectedSprint
);

// AFTER - Use API filtering
const sprintTasks = await taskService.getTasksBySprint(selectedSprint);
```

### 2. **Missing TaskService Methods**
**File:** `frontend/src/services/taskService.js`

**Issue:** The taskService didn't have dedicated methods to fetch tasks by project or sprint.

**Fix:** Added two new methods:
```javascript
getTasksByProject: async (projectId) => {
    const response = await api.get(`/tasks?projectId=${projectId}`);
    return response.data;
},

getTasksBySprint: async (sprintId) => {
    const response = await api.get(`/tasks?sprintId=${sprintId}`);
    return response.data;
}
```

### 3. **Missing Auto-Refresh on Task Creation**
**File:** `frontend/src/components/tasks/ScrumBoard.jsx`

**Issue:** After creating a task, the ScrumBoard didn't automatically refresh to show the new task.

**Fix:** 
- Added `refreshTrigger` state to manually trigger reloads
- Added a new `useEffect` hook that watches the `sprints` array from ProjectContext
- When sprints change (which happens when new tasks are created), ScrumBoard automatically reloads

```javascript
// Added dependency on sprints changes
useEffect(() => {
    if (selectedSprint && sprints.length > 0) {
        loadSprintTasks();
    }
}, [sprints]);
```

## How It Works Now

1. **User creates issue** in CreateIssueModal
   - Selects Sprint 5
   - Submits form → API creates task with `sprint: sprintId`

2. **Backend** (projectController.js)
   - Task is saved with `sprint: "sprint-5-id"`
   - Response includes the created task

3. **Frontend** automatically refreshes:
   - ProjectContext's `refreshBoard()` is called (or sprints data updates)
   - This triggers the `useEffect` watching `sprints`
   - ScrumBoard calls `getTasksBySprint(selectedSprint)`
   - New task appears in the correct column

## Files Modified

1. **backend/controllers/projectController.js**
   - Already correctly storing `sprint: sprintId` in tasks

2. **frontend/src/services/taskService.js**
   - Added `getTasksByProject()` method
   - Added `getTasksBySprint()` method

3. **frontend/src/components/tasks/ScrumBoard.jsx**
   - Fixed `loadSprintTasks()` to use API filtering
   - Added auto-refresh on sprints data changes
   - Improved status handling with fallback

## Testing Checklist

- [ ] Create issue → Assign to Sprint 5 → Verify appears in Sprint 5 board
- [ ] Create issue → Leave sprint empty (backlog) → Verify appears in Backlog
- [ ] Drag task between status columns → Verify update persists
- [ ] Switch between sprints → Verify tasks filter correctly
- [ ] Create issue from sprint board → Verify auto-refresh works
- [ ] Create issue from project dashboard → Verify sprint board updates

## Backend Notes

The backend was already correct:
- Task model stores `sprint` as an ObjectId reference
- API populates `sprint` with full object
- getTasks endpoint filters by `sprint` field correctly
- createTask endpoint saves `sprintId` to `sprint` field

No backend changes were needed.
