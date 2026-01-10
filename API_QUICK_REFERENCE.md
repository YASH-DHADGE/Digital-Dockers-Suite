# 🚀 API Quick Reference Card

## Sub-Task Management Endpoints

### 1. Create Sub-Task
```bash
POST /api/work-items/:parentId/subtasks

curl -X POST http://localhost:5000/api/work-items/parent123/subtasks \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Fix authentication bug",
    "storyPoints": 3,
    "priority": "high",
    "assignedTo": "user456"
  }'
```
**Response:** 201 Created - New subtask object

---

### 2. List Sub-Tasks
```bash
GET /api/work-items/:parentId/subtasks

curl http://localhost:5000/api/work-items/parent123/subtasks \
  -H "Authorization: Bearer YOUR_TOKEN"
```
**Response:** 200 OK - Array of subtasks with metadata

---

### 3. Update Sub-Task Status
```bash
PATCH /api/work-items/:taskId/status

curl -X PATCH http://localhost:5000/api/work-items/task123/status \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{ "status": "in_progress" }'
```
**Status Options:** `todo`, `in_progress`, `in_review`, `done`  
**Response:** 200 OK - Updated task + parent task (if updated)

---

### 4. Update Sub-Task Details
```bash
PATCH /api/work-items/:taskId

curl -X PATCH http://localhost:5000/api/work-items/task123 \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Updated title",
    "storyPoints": 5,
    "priority": "medium",
    "assignedTo": "user789"
  }'
```
**Response:** 200 OK - Updated task object

---

### 5. Delete Sub-Task
```bash
DELETE /api/work-items/:taskId

curl -X DELETE http://localhost:5000/api/work-items/task123 \
  -H "Authorization: Bearer YOUR_TOKEN"
```
**Response:** 200 OK - Success message  
**Side Effect:** Parent status auto-updates

---

### 6. Move Sub-Task to Different Parent
```bash
PATCH /api/work-items/:taskId/parent

curl -X PATCH http://localhost:5000/api/work-items/task123/parent \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{ "parentTask": "newParent456" }'
```
**Constraints:** 
- New parent must exist
- New parent cannot be epic
- Max nesting depth = 1
**Response:** 200 OK - Updated task object

---

## Burndown & Analytics Endpoints

### 7. Get Sprint Burndown
```bash
GET /api/sprints/:sprintId/burndown

curl http://localhost:5000/api/sprints/sprint123/burndown \
  -H "Authorization: Bearer YOUR_TOKEN"
```
**Response:**
```json
{
  "success": true,
  "data": {
    "labels": ["Day 1", "Day 2", ..., "Day 10"],
    "ideal": [20, 19, 17, 16, 14, 13, 11, 10, 8, 7, 0],
    "actual": [20, 19, 18, 16, 15, 13, 12, 10, 8, 6, 4],
    "currentDay": 7,
    "sprintDays": 10,
    "committedPoints": 20,
    "remainingPoints": 4,
    "completionPercent": 80,
    "health": "at-risk",
    "trend": "worsening",
    "forecast": "2026-01-20"
  }
}
```

---

### 8. Get Burndown History
```bash
GET /api/burndown/project/:projectId/history?limit=5

curl http://localhost:5000/api/burndown/project/proj123/history?limit=5 \
  -H "Authorization: Bearer YOUR_TOKEN"
```
**Parameters:**
- `limit` (optional): Number of sprints to return (default: 10)

**Response:** Array of past sprints with burndown metrics

---

### 9. Get Team Velocity
```bash
GET /api/burndown/project/:projectId/velocity

curl http://localhost:5000/api/burndown/project/proj123/velocity \
  -H "Authorization: Bearer YOUR_TOKEN"
```
**Response:**
```json
{
  "avgVelocity": 18,
  "minVelocity": 14,
  "maxVelocity": 23,
  "trend": "improving",
  "sprints": [
    { "name": "Sprint 10", "velocity": 18 },
    { "name": "Sprint 9", "velocity": 16 },
    ...
  ]
}
```

---

## Common Status Codes

| Code | Meaning | Example |
|------|---------|---------|
| 200 | Success | Sub-task updated |
| 201 | Created | New sub-task created |
| 400 | Bad Request | Invalid status value |
| 401 | Unauthorized | Missing token |
| 404 | Not Found | Parent task doesn't exist |
| 409 | Conflict | Cannot nest subtask in subtask |
| 500 | Server Error | Database connection issue |

---

## Error Response Format

```json
{
  "success": false,
  "error": {
    "code": "INVALID_PARENT",
    "message": "Parent task cannot be an epic",
    "details": {
      "parentId": "epic123",
      "parentType": "epic"
    }
  }
}
```

---

## Request Headers Required

```
Authorization: Bearer {JWT_TOKEN}
Content-Type: application/json
```

---

## Field Validation Rules

### Title
- Required ✓
- Min: 3 characters
- Max: 255 characters

### Story Points
- Required ✓
- Min: 0
- Max: 100
- Type: Integer

### Priority
- Options: `low`, `medium`, `high`, `critical`
- Default: `medium`

### Status
- Options: `todo`, `in_progress`, `in_review`, `done`
- Default: `todo`

### Due Date
- Format: ISO 8601 (YYYY-MM-DD or ISO timestamp)
- Cannot be in the past
- Optional

### Assigned To
- Must be valid user ID
- Optional
- Can be changed after creation

---

## Example Workflow

### 1. Create Epic/Story
```bash
POST /api/work-items
{
  "title": "Implement user authentication",
  "issueType": "story",
  "storyPoints": 13,
  "project": "proj123"
}
# Response: { _id: "story456" }
```

### 2. Create Sub-Task 1
```bash
POST /api/work-items/story456/subtasks
{
  "title": "Design login form UI",
  "storyPoints": 3
}
# Response: { _id: "subtask1", status: "todo" }
# Parent auto-updated: { status: "todo" }
```

### 3. Create Sub-Task 2
```bash
POST /api/work-items/story456/subtasks
{
  "title": "Implement authentication API",
  "storyPoints": 5,
  "assignedTo": "user789"
}
# Response: { _id: "subtask2", status: "todo" }
```

### 4. Create Sub-Task 3
```bash
POST /api/work-items/story456/subtasks
{
  "title": "Add password reset flow",
  "storyPoints": 5
}
# Response: { _id: "subtask3", status: "todo" }
```

### 5. Start Work - Update Sub-Task 1
```bash
PATCH /api/work-items/subtask1/status
{ "status": "in_progress" }
# Response: 
# - subtask1: { status: "in_progress" }
# - story456: { status: "in_progress" }  ← AUTO-UPDATED
```

### 6. Complete Sub-Task 1
```bash
PATCH /api/work-items/subtask1/status
{ "status": "done" }
# Response: status "done"
# Parent status: Still "in_progress" (other subtasks not done)
```

### 7. Complete Remaining Tasks
```bash
# Update subtask2 and subtask3 to "done"
PATCH /api/work-items/subtask2/status
{ "status": "done" }

PATCH /api/work-items/subtask3/status
{ "status": "done" }
# When last subtask marked done:
# - story456 AUTO-UPDATES to: { status: "done" }
```

### 8. Check Sprint Progress
```bash
GET /api/sprints/sprint123/burndown
# Response shows:
# - Burndown chart data
# - 13 points completed (3+5+5)
# - Health: "on-track" or "at-risk"
# - Trend: "improving", "stable", or "worsening"
# - Forecast: Completion date
```

---

## Environment Variables Needed

```env
# Backend (.env file)
MONGODB_URI=mongodb://localhost:27017/digital-dockers
JWT_SECRET=your_secret_key_here
NODE_ENV=development
PORT=5000

# Frontend (.env file)
VITE_API_URL=http://localhost:5000/api
```

---

## Performance Tips

### 1. Use Indexing
Already implemented on:
- `parentTask` + `project` compound index
- `parentTask` + `status` compound index
- `project` + `status` compound index

### 2. Pagination for Large Datasets
```bash
GET /api/work-items?page=1&limit=20&parentTask=parent123
```

### 3. Filter by Status
```bash
GET /api/work-items/parent123/subtasks?status=todo
```

### 4. Batch Operations
Create multiple subtasks before refreshing UI to reduce requests

---

## Troubleshooting

### Q: Sub-task not appearing after creation
**A:** Clear browser cache and refresh. API returns 201 but UI didn't update state.

### Q: Parent status not updating
**A:** Check if child is actually in database. Update child status via API, not local edit.

### Q: Burndown chart shows no data
**A:** Ensure sprint exists and has tasks assigned. Check sprint dates are correct.

### Q: Getting 401 Unauthorized
**A:** Token expired. Re-login and check localStorage for valid JWT.

### Q: Cannot delete sub-task
**A:** Check if you have permission. Ensure parent task ID is correct.

---

## Rate Limiting

No rate limiting currently implemented. Production deployment should add:
```javascript
const rateLimit = require('express-rate-limit');
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100 // limit each IP to 100 requests per windowMs
});
```

---

## Testing with Postman

Import this collection JSON:

```json
{
  "info": {
    "name": "Subtask API",
    "version": "1.0"
  },
  "item": [
    {
      "name": "Create Subtask",
      "request": {
        "method": "POST",
        "url": "http://localhost:5000/api/work-items/{{parentId}}/subtasks",
        "header": [
          {
            "key": "Authorization",
            "value": "Bearer {{token}}"
          }
        ],
        "body": {
          "mode": "raw",
          "raw": "{\"title\":\"Test subtask\",\"storyPoints\":3}"
        }
      }
    }
  ]
}
```

---

**Last Updated:** January 10, 2026  
**API Version:** v1.0  
**Status:** Production Ready ✅
