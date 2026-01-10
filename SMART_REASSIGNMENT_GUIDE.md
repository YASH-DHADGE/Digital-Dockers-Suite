# Smart Reassignment Assistant - Complete Implementation Guide

## 📋 Overview

The **Smart Reassignment Assistant** is an intelligent task management feature that analyzes team workloads and recommends optimal task reassignments to balance work across team members.

## 🎯 Features

### 1. **Workload Analysis**
- Calculates real-time workload percentage for each team member
- Formula: `Workload % = (Assigned Hours / Capacity Hours) * 100`
- Default capacity: 40 hours per sprint
- Considers only active tasks (todo, in_progress, review)

### 2. **Intelligent Recommendation Engine**
- Triggers when team member workload exceeds 60%
- Analyzes multiple candidates from the same team/sprint
- Excludes employees on leave or with high workload
- Uses multi-factor scoring algorithm

### 3. **Smart Scoring Algorithm**
Composite score calculation with weighted factors:
```
Total Score = (SkillMatch × 50%) + (InverseWorkload × 30%) + (RoleMatch × 20%)
```

**Scoring Weights:**
- **Skill Match (50%)**: How well candidate's skills match task requirements
- **Workload Balance (30%)**: Lower workload preference (inverse score)
- **Role Match (20%)**: If candidate has same role as current assignee

**Score Interpretation:**
- 80-100%: Excellent recommendation
- 60-79%: Good recommendation  
- <60%: Acceptable recommendation

### 4. **Smart Filtering**
Candidate must meet ALL criteria:
- ✅ Has required skills (full or partial match)
- ✅ Workload less than 60%
- ✅ Active team member (not on leave)
- ✅ Same team/sprint
- ✅ Not the current assignee

### 5. **Confirmation Logic**
- **Normal priority**: Auto-reassign available
- **High/Highest priority**: Requires manager confirmation before executing

## 🔧 API Endpoints

### Get Recommendation for a Task
```
GET /api/reassignment/:taskId/recommend
```
**Response:**
```json
{
  "success": true,
  "data": {
    "recommendation": {
      "employeeId": "user_id_123",
      "name": "John Doe",
      "email": "john@example.com",
      "role": "technical_team",
      "currentWorkloadPercentage": 45,
      "skills": ["React", "Node.js", "MongoDB"],
      "departureScore": 85,
      "skillMatchPercentage": 90,
      "isRoleMatch": true
    },
    "currentAssignee": {
      "id": "user_id_456",
      "name": "Jane Smith",
      "workloadPercentage": 75
    },
    "reason": "Human-readable explanation of recommendation",
    "score": 85,
    "allCandidates": [...]
  }
}
```

### Execute Reassignment
```
POST /api/reassignment/:taskId/execute
Content-Type: application/json

{
  "newAssigneeId": "user_id_123",
  "requiresConfirmation": false
}
```

### Get Team Workload Analysis
```
GET /api/reassignment/team/analysis?sprintId=sprint_id
```

**Response:**
```json
{
  "success": true,
  "data": {
    "summary": {
      "totalEmployees": 10,
      "averageWorkload": 55,
      "overloadedCount": 3,
      "underutilizedCount": 2,
      "balancedCount": 5
    },
    "details": {
      "overloaded": [...],  // >60% workload
      "balanced": [...],    // 35-60% workload
      "underutilized": [...] // <35% workload
    }
  }
}
```

### Batch Analyze All Tasks
```
POST /api/reassignment/batch-analyze
Content-Type: application/json

{
  "sprintId": "sprint_id"
}
```

Returns all reassignment opportunities in the sprint.

## 📊 Data Models

### Employee Profile
```javascript
{
  _id: ObjectId,
  fullName: String,
  email: String,
  role: String,
  profileInfo: {
    skills: [String],              // e.g., ["React", "Node.js", "MongoDB"]
    capacityHoursPerSprint: Number, // Default: 40
    isOnLeave: Boolean,
    department: String
  }
}
```

### Task
```javascript
{
  _id: ObjectId,
  title: String,
  estimatedTime: Number,  // in hours
  tags: [String],         // Used as requiredSkills
  assignedTo: [ObjectId], // Array of user IDs
  sprint: ObjectId,
  priority: String,       // 'lowest' | 'low' | 'medium' | 'high' | 'highest'
  status: String,         // 'todo' | 'in_progress' | 'review' | 'done' | 'blocked'
  requiredSkills: [String]
}
```

## 💻 Frontend Components

### SmartReassignmentDashboard
Located at: `frontend/src/components/dashboards/SmartReassignmentDashboard.jsx`

**Features:**
- Real-time workload visualization
- Team statistics dashboard
- Overloaded member highlights
- Recommendation cards with action buttons
- Modal review before reassignment
- Score breakdown and candidate ranking

**Usage:**
```jsx
<SmartReassignmentDashboard sprintId={sprintId} />
```

## 🎮 How to Use

### Step 1: View Team Analysis
1. Navigate to Smart Reassignment Dashboard
2. System automatically analyzes team workload
3. See overloaded, balanced, and underutilized members

### Step 2: Review Recommendations
1. Check "Reassignment Opportunities" section
2. Each recommendation shows:
   - Current overloaded assignee
   - Recommended replacement
   - Skill match percentage
   - Recommendation score

### Step 3: Get Detailed Recommendation
1. Click "Review & Reassign" on any opportunity
2. Modal opens with:
   - Detailed reason for recommendation
   - Skill match analysis
   - Current workload comparison
   - All candidate rankings

### Step 4: Execute Reassignment
1. Review the recommendation
2. For high-priority tasks: Check confirmation box
3. Click "Reassign Task"
4. Task is reassigned and history is logged

## 🧮 Calculation Examples

### Example 1: Workload Calculation
```
Employee: John (Capacity: 40 hours/week)
Tasks:
- Task A: 8 hours
- Task B: 12 hours
- Task C: 16 hours
Total: 36 hours

Workload = (36 / 40) × 100 = 90% (OVERLOADED)
```

### Example 2: Scoring Calculation
```
Current Assignee: Jane (75% workload)
Candidate: Mike
- Task requires: [React, Node.js, Docker]
- Mike has: [React, Node.js, MongoDB]
- Mike's workload: 45%

Scores:
- Skill Match: 67% (2/3 skills match) → 67 points
- Inverse Workload: 55% (100 - 45) → 55 points
- Role Match: 100% (same role) → 100 points

Total = (67 × 0.5) + (55 × 0.3) + (100 × 0.2)
      = 33.5 + 16.5 + 20
      = 70 / 100 (GOOD RECOMMENDATION)
```

## 🔐 Authorization

- **View Dashboard**: All authenticated users
- **Get Recommendations**: All authenticated users
- **Execute Reassignment**: Admin, Project Manager, Technical Lead
- **Batch Analysis**: Admin, Project Manager, Technical Lead

## ⚙️ Configuration

Edit in `SmartReassignmentService.CONFIG`:
```javascript
{
    OVERLOAD_THRESHOLD: 60,        // Trigger point (>60%)
    UNDERLOAD_THRESHOLD: 60,       // Acceptable max
    DEFAULT_CAPACITY_HOURS: 40,    // Default sprint capacity
    
    SCORING: {
        SKILL_MATCH_WEIGHT: 50,    // 50%
        WORKLOAD_WEIGHT: 30,       // 30%
        ROLE_MATCH_WEIGHT: 20      // 20%
    }
}
```

## 🚀 Edge Cases Handled

| Scenario | Behavior |
|----------|----------|
| No candidates available | Return error with reason |
| All team members overloaded | Recommend least overloaded |
| No skill match | Accept role-based match |
| Multiple high scores | Return top-ranked candidate |
| Task priority is high | Require manager confirmation |
| Employee on leave | Skip in candidate search |
| No capacity data | Use default 40 hours |
| No estimated time on task | Use default 8 hours |

## 📝 Logging & Events

### Console Logs
```
🔍 Analyzing task for reassignment: task_id
📊 Current assignee workload: 75%
👥 Evaluating 8 team members...
  • John Smith: Score=85 | Skills=100% | Workload=45%
  • Jane Doe: Score=72 | Skills=80% | Workload=52%
✅ Top recommendation: John Smith (Score: 85)
```

### Socket Events
```javascript
// When reassignment is executed
io.emit('task:reassigned', {
    taskId: "task_id",
    fromAssignee: "user_id_old",
    toAssignee: "user_id_new",
    reassignedBy: "manager_name",
    timestamp: new Date()
});
```

## 🔄 Integration Points

### With Task Management
- Automatically triggered when creating/updating tasks
- Accessible from task detail views
- Linked to task history

### With Sprint Planning
- Sprint-scoped analysis available
- Batch analysis for entire sprint
- Real-time rebalancing during sprint

### With Dashboard
- Standalone dashboard component
- Embed in project dashboard
- Real-time updates via WebSocket

## 🧪 Testing the Feature

### Manual Test Flow
1. Create tasks for team member with >60% workload
2. Assign tasks with specific skills
3. Click "Review & Reassign" button
4. Verify recommendation has:
   - Higher skill match if applicable
   - Lower workload percentage
   - Score >70 for acceptance
5. Execute reassignment
6. Verify task history is updated

### API Testing (cURL)
```bash
# Get recommendation
curl http://localhost:5000/api/reassignment/task_id/recommend \
  -H "Authorization: Bearer token"

# Execute reassignment
curl -X POST http://localhost:5000/api/reassignment/task_id/execute \
  -H "Authorization: Bearer token" \
  -H "Content-Type: application/json" \
  -d '{"newAssigneeId":"user_id"}'

# Get team analysis
curl http://localhost:5000/api/reassignment/team/analysis?sprintId=sprint_id \
  -H "Authorization: Bearer token"
```

## 📈 Future Enhancements

- [ ] Machine learning for better scoring
- [ ] Predictive workload based on task complexity
- [ ] Team capacity planning view
- [ ] Automated rebalancing option
- [ ] Skill development recommendations
- [ ] Historical trend analysis
- [ ] Cost-based optimization
- [ ] Cross-project load balancing

## 🐛 Troubleshooting

| Issue | Solution |
|-------|----------|
| No recommendations | Check if team members have skills defined |
| Wrong workload % | Verify estimatedTime on all tasks |
| Can't reassign | Check authorization (need PM/Lead role) |
| High priority prompt | This is by design - confirm to proceed |
| No candidates | All team members overloaded or on leave |

---

**Last Updated**: January 10, 2026
**Version**: 1.0
**Status**: Production Ready ✅
