# Smart Reassignment Assistant - Developer Quick Reference

## 📂 File Structure

```
Digital-Dockers-Suite/
├── backend/
│   ├── services/
│   │   ├── smartReassignmentService.js      ← Core algorithm
│   │   └── workloadBalancingService.js      ← Legacy (enhanced by smart service)
│   ├── controllers/
│   │   └── reassignmentController.js        ← API handlers
│   ├── routes/
│   │   └── reassignmentRoutes.js            ← API endpoints
│   ├── models/
│   │   ├── User.js                          ← (Updated: added capacityHoursPerSprint)
│   │   └── Task.js                          ← (Uses: tags as requiredSkills)
│   └── server.js                            ← (Updated: added reassignment routes)
│
├── frontend/
│   ├── src/
│   │   └── components/
│   │       └── dashboards/
│   │           └── SmartReassignmentDashboard.jsx  ← UI Component
│
└── SMART_REASSIGNMENT_GUIDE.md              ← Full documentation
```

## 🔑 Key Functions

### SmartReassignmentService

```javascript
// Calculate individual workload
await SmartReassignmentService.calculateEmployeeWorkload(employeeId, sprintId)
// Returns: { employeeId, assignedHours, capacityHours, workloadPercentage, isOverloaded }

// Get main recommendation
await SmartReassignmentService.getReassignmentRecommendation(taskId)
// Returns: { success, recommendation, currentAssignee, reason, score, allCandidates }

// Execute reassignment
await SmartReassignmentService.executeReassignment(taskId, newAssigneeId, approvedBy)
// Returns: { success, message, taskId, fromAssignee, toAssignee }

// Team analysis
await SmartReassignmentService.getTeamWorkloadAnalysis(sprintId)
// Returns: { summary, details: { overloaded, balanced, underutilized } }
```

### Helper Functions

```javascript
// Calculate skill match (0-100)
SmartReassignmentService.calculateSkillMatch(requiredSkills, employeeSkills)

// Calculate composite score (0-100)
SmartReassignmentService.calculateCandidateScore(candidateData)

// Get team members with filters
await SmartReassignmentService.getTeamMembers(sprintId, excludeEmployeeId)
```

## 🔗 API Integration

### In Your Component

```jsx
import axios from 'axios';

// Get recommendation
const response = await axios.get(`/api/reassignment/${taskId}/recommend`);
const { recommendation, reason, score } = response.data.data;

// Execute reassignment
await axios.post(`/api/reassignment/${taskId}/execute`, {
    newAssigneeId: recommendedEmployeeId,
    requiresConfirmation: false
});

// Get team analysis
const analysis = await axios.get('/api/reassignment/team/analysis', {
    params: { sprintId: sprintId }
});
```

## 🧮 Scoring Logic in Plain English

```
For each candidate:
  1. Calculate % of task's required skills they have (0-100)
  2. Calculate their free workload capacity (100 - currentWorkload%)
  3. Check if they have same role as current assignee (yes=100, no=50)
  
  Score = (skillPercentage × 0.5) + (freeCapacity × 0.3) + (roleMatch × 0.2)
  
  → Higher score = better candidate
  → Only consider candidates with score > 0 and workload < 60%
```

## 🎯 Common Usage Patterns

### Pattern 1: Auto-Recommend on Task Creation
```javascript
// In taskController.js createTask()
const recommendation = await SmartReassignmentService.getReassignmentRecommendation(taskId);
if (recommendation.success) {
    // Notify manager about recommendation
    io.emit('recommendation:available', recommendation);
}
```

### Pattern 2: Bulk Rebalance at Sprint End
```javascript
// Get all overloaded tasks
const analysis = await SmartReassignmentService.getTeamWorkloadAnalysis(sprintId);

for (const overloadedMember of analysis.details.overloaded) {
    // Get their tasks
    const tasks = await Task.find({ assignedTo: overloadedMember.employeeId });
    
    // Recommend for each
    for (const task of tasks) {
        const rec = await SmartReassignmentService.getReassignmentRecommendation(task._id);
        if (rec.success) {
            await SmartReassignmentService.executeReassignment(task._id, rec.recommendation.employeeId);
        }
    }
}
```

### Pattern 3: Update Dashboard in Real-Time
```javascript
// Subscribe to workload changes
useEffect(() => {
    const fetchAnalysis = async () => {
        const res = await axios.get('/api/reassignment/team/analysis', { params: { sprintId } });
        setAnalysis(res.data.data);
    };
    
    fetchAnalysis();
    const interval = setInterval(fetchAnalysis, 30000); // Refresh every 30 seconds
    return () => clearInterval(interval);
}, [sprintId]);
```

## 📊 Data Flow Diagram

```
User Action: "Review Task for Reassignment"
    ↓
GET /api/reassignment/:taskId/recommend
    ↓
SmartReassignmentService.getReassignmentRecommendation()
    ├─ Fetch task details (including requiredSkills from tags)
    ├─ Calculate current assignee's workload
    ├─ Find team members in same sprint
    ├─ For each candidate:
    │  ├─ Check if active & not on leave
    │  ├─ Verify workload < 60%
    │  ├─ Calculate skill match (required ↔ employee skills)
    │  ├─ Calculate workload score (inverse of current %)
    │  ├─ Calculate role match (same role = 100, else = 50)
    │  └─ Score = (skill×0.5) + (workload×0.3) + (role×0.2)
    ├─ Sort by score
    ├─ Select top candidate
    └─ Build human-readable reason
    ↓
Response: { recommendation, currentAssignee, reason, score, allCandidates }
    ↓
Frontend Modal: Show recommendation
    ↓
User clicks: "Reassign Task"
    ↓
POST /api/reassignment/:taskId/execute { newAssigneeId, requiresConfirmation }
    ↓
SmartReassignmentService.executeReassignment()
    ├─ Update Task.assignedTo[0] = newAssigneeId
    ├─ Add history entry
    └─ Emit socket event 'task:reassigned'
    ↓
Success: Task reassigned, dashboard updates
```

## ⚡ Performance Tips

1. **Caching**: Cache team analysis for 30 seconds to avoid repeated DB queries
2. **Batch**: Use batch-analyze endpoint for multiple tasks instead of individual calls
3. **Indexing**: Ensure these indexes exist for best performance:
   - `Task`: { assignedTo, sprint, status }
   - `User`: { isActive, "profileInfo.isOnLeave" }

4. **Limit Candidates**: Only evaluate team members in same sprint (not all users)

## 🔧 Configuration Override

```javascript
// In smartReassignmentService.js
const CUSTOM_CONFIG = {
    OVERLOAD_THRESHOLD: 70,  // Change from 60% to 70%
    SCORING: {
        SKILL_MATCH_WEIGHT: 60,
        WORKLOAD_WEIGHT: 25,
        ROLE_MATCH_WEIGHT: 15
    }
};
```

## 🐛 Debug Mode

Enable detailed logging:
```javascript
// Add to smartReassignmentService.js
const DEBUG = true;

if (DEBUG) {
    console.log(`🔍 Analyzing task: ${taskId}`);
    console.log(`📊 Candidate scores:`, candidates);
    console.log(`✅ Selected: ${topCandidate.employee.fullName}`);
}
```

## 🧪 Unit Testing

```javascript
// Test skill matching
expect(SmartReassignmentService.calculateSkillMatch(
    ['React', 'Node.js'],
    ['React', 'Vue.js', 'Angular']
)).toBe(33); // 1 out of 3 match

// Test workload calculation
expect(await SmartReassignmentService.calculateEmployeeWorkload(userId))
    .toHaveProperty('workloadPercentage');

// Test scoring
expect(SmartReassignmentService.calculateCandidateScore({
    skillMatchPercentage: 100,
    workloadPercentage: 30,
    isRoleMatch: true
})).toBeGreaterThan(80); // Should be high score
```

## 📱 Frontend Integration Checklist

- [ ] Import SmartReassignmentDashboard component
- [ ] Add to project dashboard layout
- [ ] Pass sprintId prop
- [ ] Ensure user has API token in headers
- [ ] Test authorization (PM/Lead roles for execute)
- [ ] Wire up WebSocket for real-time updates
- [ ] Test with various workload scenarios
- [ ] Verify modal functionality
- [ ] Test high-priority confirmation flow

## 🔐 Security Notes

- **Authorization**: Only PM/Lead can execute reassignments
- **Validation**: All inputs validated server-side
- **Audit**: Every reassignment logged with user and timestamp
- **Rate Limiting**: Consider rate limiting batch-analyze endpoint
- **Data**: Filters only return data user has access to (sprint members)

## 💡 Pro Tips

1. **Use batch-analyze** before sprint planning meetings
2. **Monitor overloaded count** as a health metric
3. **Set alerts** when overloaded count > 20% of team
4. **Review recommendations** before executing
5. **Check score** - confidence > 70% recommended
6. **Consider soft skills** - adjust scoring weights for your team
7. **Update capacities** seasonally (peak vs normal periods)

---

**For full documentation, see**: `SMART_REASSIGNMENT_GUIDE.md`
