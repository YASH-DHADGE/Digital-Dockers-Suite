# Subtask Feature - Architecture & Data Flow

## System Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                         USER INTERFACE                          │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌──────────────────┐      ┌──────────────────────────────┐   │
│  │  SubTaskPanel    │      │ SubTaskCreationModal         │   │
│  ├──────────────────┤      ├──────────────────────────────┤   │
│  │ • Expand/collapse│      │ • Form inputs                │   │
│  │ • List children  │      │ • Validation                 │   │
│  │ • Status update  │      │ • Submit to API              │   │
│  │ • Delete         │      └──────────────────────────────┘   │
│  │ • Drag & drop    │                                          │
│  │ • Keyboard nav   │                                          │
│  └────────┬─────────┘                                          │
│           │                                                    │
└───────────┼────────────────────────────────────────────────────┘
            │
            │ useSubTasks Hook
            │ (State Management)
            │
┌───────────▼────────────────────────────────────────────────────┐
│                    CUSTOM REACT HOOK                           │
├──────────────────────────────────────────────────────────────────┤
│                                                                 │
│  useSubTasks(parentTaskId)                                      │
│  ├─ fetchChildren()                                             │
│  ├─ fetchStoryPoints()                                          │
│  ├─ updateChildStatus()                                         │
│  ├─ createSubtask()                                             │
│  ├─ deleteChild()                                               │
│  ├─ moveChild()                                                 │
│  └─ bulkUpdateStatus()                                          │
│                                                                 │
└────────────┬─────────────────────────────────────────────────────┘
             │
             │ axios HTTP Requests
             │
┌────────────▼──────────────────────────────────────────────────┐
│                    REST API LAYER                             │
├──────────────────────────────────────────────────────────────┤
│                                                              │
│  POST   /api/work-items/:parentId/subtasks                  │
│  GET    /api/work-items/:parentId/subtasks                  │
│  GET    /api/work-items/:id/hierarchy                       │
│  PATCH  /api/work-items/:id/status                          │
│  POST   /api/work-items/:childId/move/:newParentId          │
│  DELETE /api/work-items/:id                                 │
│  ... (5 more endpoints)                                      │
│                                                              │
└────────────┬──────────────────────────────────────────────────┘
             │
             │ Express.js Routing
             │
┌────────────▼──────────────────────────────────────────────────┐
│              BUSINESS LOGIC LAYER                            │
├──────────────────────────────────────────────────────────────┤
│                                                              │
│  workItemService                                             │
│  ├─ createSubtask()          [5 validation checks]          │
│  ├─ getChildren()            [with pagination]              │
│  ├─ updateChildStatus()      [auto-update parent]           │
│  ├─ evaluateParentStatusUpdate()  [complex logic]           │
│  ├─ deleteWorkItem()         [cascade safety]               │
│  ├─ moveChild()              [validation + update]          │
│  └─ calculateStoryPoints()   [aggregation]                  │
│                                                              │
│  All methods:                                                │
│  ✓ Use MongoDB transactions                                  │
│  ✓ Include error handling                                    │
│  ✓ Call audit logging                                        │
│  ✓ Validate constraints                                      │
│                                                              │
└────────────┬──────────────────────────────────────────────────┘
             │
             │ Mongoose ODM
             │
┌────────────▼──────────────────────────────────────────────────┐
│              DATA MODEL LAYER                                │
├──────────────────────────────────────────────────────────────┤
│                                                              │
│  Task Schema (MongoDB)                                       │
│  ├─ title: String                                            │
│  ├─ description: String                                      │
│  ├─ status: 'todo'|'in_progress'|'in_review'|'done'         │
│  ├─ parentTask: ObjectId (with async validator)             │
│  ├─ issueType: 'task'|'subtask'|'epic'                      │
│  ├─ storyPoints: Number (0-100)                             │
│  ├─ assignedTo: User ref                                     │
│  ├─ project: Project ref                                     │
│  ├─ createdAt, updatedAt                                     │
│  │                                                           │
│  ├─ Validators:                                              │
│  │  ✓ Async parentTask validator                             │
│  │  ✓ Pre-save middleware (4 rules)                          │
│  │  ✓ Index validation                                       │
│  │                                                           │
│  ├─ Indexes:                                                 │
│  │  ✓ {parentTask: 1, project: 1}                            │
│  │  ✓ {project: 1, status: 1}                                │
│  │  ✓ {sprint: 1, status: 1}                                 │
│  │  ✓ {parentTask: 1, status: 1}                             │
│  │  ✓ {assignedTo: 1, project: 1}                            │
│  │  ✓ {epic: 1}                                              │
│  │                                                           │
│  └─ Methods:                                                 │
│     ✓ getChildren()                                          │
│     ✓ getParent()                                            │
│     ✓ calculateChildrenStoryPoints()                         │
│     ✓ allChildrenDone()                                      │
│     ✓ anyChildInProgress()                                   │
│     ✓ countChildren()                                        │
│                                                              │
└────────────┬──────────────────────────────────────────────────┘
             │
             │ MongoDB Driver
             │
┌────────────▼──────────────────────────────────────────────────┐
│                DATABASE LAYER                                │
├──────────────────────────────────────────────────────────────┤
│                                                              │
│  MongoDB Collections                                         │
│  ├─ tasks                   [Parent & Subtask items]         │
│  ├─ activitylogs            [Audit trail]                    │
│  └─ users                   [Assignment targets]             │
│                                                              │
│  All writes use transactions for ACID compliance             │
│                                                              │
└──────────────────────────────────────────────────────────────┘
```

---

## Data Flow: Create Subtask

```
User fills form in Modal
        ↓
Validates (client-side)
        ↓
POST /api/work-items/:parentId/subtasks
        ↓
subtaskRoutes.js catches request
        ↓
Validates input
        ↓
workItemService.createSubtask()
        ├─ Validate parent exists
        ├─ Validate parent not epic
        ├─ Validate no deep nesting
        ├─ Start MongoDB transaction
        ├─ Create subtask document
        ├─ Auto-update parent if todo
        ├─ Log action to ActivityLog
        ├─ Commit transaction
        └─ Return new subtask
        ↓
Response sent to client
        ↓
useSubTasks hook refreshes children
        ↓
SubTaskPanel updates display
        ↓
Modal closes, success shown
        ↓
User sees new subtask in list
```

---

## Data Flow: Update Status (with Parent Auto-Update)

```
User clicks status dropdown
        ↓
Selects new status
        ↓
PATCH /api/work-items/:childId/status
        ↓
workItemService.updateChildStatus()
        ├─ Update child status
        ├─ Get all siblings
        ├─ Call evaluateParentStatusUpdate()
        │   ├─ If ALL children done → parent='done'
        │   ├─ Else if ANY child in_progress → parent='in_progress'
        │   ├─ Else if ANY child in_review → parent='in_review'
        │   └─ Else → parent='todo'
        ├─ Update parent status
        ├─ Log actions
        └─ Commit transaction
        ↓
Response includes {child, parent}
        ↓
useSubTasks hook updates state
        ↓
SubTaskPanel reflects changes
        ↓
Stats update automatically
        ↓
Progress bar recalculates
```

---

## Data Flow: Delete Subtask

```
User clicks delete button
        ↓
Confirmation dialog shows
        ↓
User confirms
        ↓
DELETE /api/work-items/:childId
        ↓
workItemService.deleteWorkItem()
        ├─ Check if item has children
        ├─ If yes, return error
        ├─ If no, proceed
        ├─ Start transaction
        ├─ Delete the task
        ├─ Get parent & re-evaluate status
        ├─ Update parent status
        ├─ Log deletion
        └─ Commit transaction
        ↓
Response sent
        ↓
useSubTasks refreshes children
        ↓
SubTaskPanel updates list
        ↓
Stats and progress bar update
```

---

## Parent Status Update Logic

```
After any child status change:

Check all children statuses
        ↓
    ┌─────────────────────────┐
    │ Are ALL children done?  │ YES → Parent = 'done' ✓
    └──────────┬──────────────┘
              NO
               ↓
    ┌─────────────────────────┐
    │ Is ANY child in_progress?│ YES → Parent = 'in_progress' ✓
    └──────────┬──────────────┘
              NO
               ↓
    ┌─────────────────────────┐
    │ Is ANY child in_review?  │ YES → Parent = 'in_review' ✓
    └──────────┬──────────────┘
              NO
               ↓
            Parent = 'todo' ✓
```

---

## Keyboard Navigation Flow

```
User presses key while focused on subtask
        ↓
    ┌──────────────────┐
    │ Which key?       │
    └──────────────────┘
      /    |    |   \
    ↑     ↓   Ent  Del  Esc
   /     /     |    |    \
  Move   Move  Show  Del  Clear
  Prev   Next  More  Item Focus
  Item   Item
    ↓     ↓     ↓    ↓    ↓
  Focus  Focus Focus Call Clear
  Prev   Next  on   confirm selection
  Item   Item  desc dialog
         Focus
         on
         next
```

---

## Component Hierarchy

```
Application
├── TaskDetailExample (or your page)
│   └── SubTaskPanel
│       ├── useSubTasks Hook (manages state)
│       ├── SubTaskCreationModal
│       │   ├── Form Fields
│       │   └── Validation
│       └── Children List
│           ├── Child Item 1
│           │   ├── Status Select
│           │   ├── Delete Button
│           │   └── Description
│           ├── Child Item 2
│           └── ...
└── Keyboard Shortcuts Info
```

---

## State Management (useSubTasks Hook)

```
Hook State:
├── children: Array          [List of subtasks]
├── storyPoints: Object      {own, children, total, hasChildren}
├── stats: Object            {total, done, inProgress, pending}
├── isLoading: Boolean       [Loading indicator]
├── error: String|null       [Error message]
└── actions: Object          [All CRUD methods]

Actions Available:
├── fetchChildren()          [GET /api/work-items/:id/subtasks]
├── fetchStoryPoints()       [GET /api/work-items/:id/story-points]
├── updateChildStatus()      [PATCH /api/work-items/:id/status]
├── createSubtask()          [POST /api/work-items/:id/subtasks]
├── deleteChild()            [DELETE /api/work-items/:id]
├── moveChild()              [POST /api/work-items/:id/move/:newId]
├── detachChild()            [POST /api/work-items/:id/detach]
├── bulkUpdateStatus()       [POST /api/work-items/:id/bulk-status]
└── clearError()             [Clear error message]
```

---

## Error Handling Chain

```
Error occurs
    ↓
Caught in try-catch
    ↓
    ├─ Network error → Show "Network failed"
    ├─ 400 error → Show validation message
    ├─ 404 error → Show "Not found"
    └─ 500 error → Show "Server error"
    ↓
Error message displayed in UI
    ↓
User can dismiss error
    ↓
Try again
```

---

## Validation Chain

```
Step 1: Client-side (Modal)
├─ Title required?
├─ Title length?
├─ Story points range (0-100)?
├─ Due date not in past?
└─ Show errors to user

Step 2: API Validation (Routes)
├─ Token valid?
├─ Parent exists?
├─ Parent ID valid?
└─ Return 400 if failed

Step 3: Service Validation (WorkItemService)
├─ Parent not epic?
├─ Not creating deep nesting?
├─ Parent not subtask?
└─ All constraints met?

Step 4: Model Validation (Task.js)
├─ Pre-save middleware
├─ Async parent validator
├─ Enforce issueType rules
└─ Final validation before save

Step 5: Database
├─ Unique indexes
├─ Required fields
├─ Type validation
└─ Transaction integrity
```

---

## Performance Optimization

```
Database Queries Use Indexes:

GET /api/work-items/:parentId/subtasks
Uses: {parentTask: 1, project: 1}
Result: O(1) lookup + O(n) fetch

PATCH /api/work-items/:id/status  
Uses: {_id: 1} + {parentTask: 1, status: 1}
Result: O(1) find + O(1) parent find

Pagination:
├─ Default limit: 50 per page
├─ Supports skip/limit params
└─ Prevents data overload

Lazy Loading:
├─ Children only fetch on expand
├─ Story points only fetch on expand
└─ Reduces initial page load
```

---

## Security Features

```
Authentication:
├─ Bearer token required
├─ Verified on every request
└─ 401 if missing/invalid

Authorization:
├─ User check in middleware
├─ Project membership verified
└─ Cannot access other projects

Data Validation:
├─ Input sanitization
├─ Type checking
├─ Range validation
└─ Constraint enforcement

Cascade Safety:
├─ Cannot delete parent with children
├─ Cannot orphan subtasks
├─ Foreign key relationships
└─ Referential integrity

Audit Logging:
├─ Every action logged
├─ User tracked
├─ Timestamp recorded
└─ Changes documented
```

---

This architecture ensures:
✅ Separation of concerns
✅ Easy testing and maintenance
✅ Scalability
✅ Error recovery
✅ Data consistency
✅ Security
✅ Performance
