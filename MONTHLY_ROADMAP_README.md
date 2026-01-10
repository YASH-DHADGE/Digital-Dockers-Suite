# Month-by-Month Progress Roadmap

## Overview

The redesigned Roadmap view transforms project planning from a future-focused view into a **progress narrative** that shows what was planned, what was completed, and what slipped to the next month—month by month.

## Key Features

### 📊 Progress Timeline View
- **Monthly Cards** displaying planned vs completed work
- **Visual Progress Indicators** with percentage completion
- **Carried Over Items** showing tasks that slipped to next month
- **AI Insights** providing automatic analysis and recommendations

### 📈 Team Velocity & Capacity Analytics
- **Velocity Trend Chart** (last 5 months)
- **Average Velocity** calculation for planning
- **Capacity Utilization** forecasting for future months
- **Burndown Estimates** based on historical velocity

### 📋 Epic View (Legacy)
- Keep the existing epic timeline for longer-term planning
- Filter by status and time range
- Create and manage epics

---

## UI Components

### 1. **MonthCard.jsx**
Displays a single month's progress with:
- Month header with completion percentage
- Planned vs Completed tasks breakdown
- Story points allocation and tracking
- Carried over items with context
- AI notes per month

**Props:**
```javascript
{
  month: {
    key: "2026-01",
    display: "January 2026",
    isPast: true,
    planned: [], // Array of tasks
    carried_over: [], // Array of deferred tasks
    notes: "AI insight for the month"
  },
  onTaskClick: (task) => {} // Click handler
}
```

### 2. **MonthlyInsights.jsx**
Displays aggregate analytics and AI insights:
- Team velocity statistics
- Velocity trend chart (Recharts)
- Capacity utilization for future months
- AI-generated recommendations

**Props:**
```javascript
{
  monthsData: {
    months: [] // Array of all months
  }
}
```

---

## Data Structure

### Monthly Progress Data
```javascript
{
  key: "2026-01",
  display: "January 2026",
  isPast: true,
  planned: [
    {
      id: "epic-1",
      name: "Authentication System",
      storyPoints: 8,
      completed: true,
      status: "DONE",
      assignee: "John Doe",
      completedDate: "2025-10-15",
      progress: 100 // For in-progress items
    }
  ],
  carried_over: [
    {
      id: "epic-5",
      name: "Analytics Dashboard",
      storyPoints: 13,
      reason: "Scope increased due to stakeholder feedback"
    }
  ],
  notes: "Strong start. Team velocity: 21 points"
}
```

---

## Key Utilities

### `monthlyProgressData.js`

#### Functions

**1. `generateMonthlyProgressData()`**
- Generates 6 months of mock data (3 past, 3 future)
- Use as template for real data integration
- Includes realistic scenarios (velocity dips, carried-over work, etc.)

**2. `calculateMonthlyMetrics(month)`**
- Returns: `{ plannedPoints, completedPoints, inProgressPoints, completionPercentage, taskCount, completedCount, carriedOverCount }`
- Used for progress bars and summary stats

**3. `generateMonthlyAIInsights(monthsData)`**
- Analyzes monthly trends
- Detects velocity dips, high carry-over rates
- Returns array of insight objects:
```javascript
{
  month: "2026-01",
  type: "success|warning|info",
  message: "Human-readable insight"
}
```

**4. `getVelocityTrend(monthsData, months = 3)`**
- Returns velocity data for chart visualization
- Format: `[{ month: "Jan 2026", velocity: 21 }, ...]`

**5. `calculateCapacityUtilization(monthsData)`**
- Forecasts team capacity for future months
- Warns of overload scenarios
- Returns:
```javascript
{
  averageVelocity: 20,
  futureCapacity: [
    { month: "Feb 2026", plannedPoints: 26, capacityUtilization: 130 }
  ]
}
```

---

## Styling

### CSS Files

**MonthCard.css** (240 lines)
- Month card layout and styling
- Task item styling with status colors
- Carried-over item warnings
- Hover states and animations
- Responsive breakpoints

**MonthlyInsights.css** (180 lines)
- Insights card styling
- Metrics card (statistics display)
- Chart container styling
- Capacity bar visualization
- AI tips styling with color-coded severity

**RoadmapPage.css** (Enhanced)
- New progress timeline layout
- Month grid responsive design
- Divider styling for section breaks

---

## Integration Points

### With Existing Systems

**1. Real Data (Phase 2)**
```javascript
// Replace mock data with API calls
const monthlyData = await api.getMonthlyProgress(projectId);
```

**2. Socket.io Real-Time Updates**
```javascript
socket.on('task:completed', (task) => {
  // Update monthly data
  setMonthlyData(updateMonthlyData(monthlyData, task));
});
```

**3. OpenAI Integration**
```javascript
// Replace heuristic insights with LLM-powered analysis
const aiInsights = await openai.generateMonthlyInsights(monthlyData);
```

---

## Feature Highlights

### 📌 What Makes It Special

1. **Progress Narrative**
   - Shows the story of the project over time
   - Not just "future features" but actual execution history

2. **Visual Velocity Tracking**
   - Instantly see team productivity trends
   - Spot slowdowns and overload situations

3. **Carried-Over Awareness**
   - Understand why items slipped
   - Learn from past delays to improve planning

4. **Capacity Planning**
   - AI warns of overloaded months
   - Helps prevent burnout and missed deadlines

5. **AI-Powered Insights**
   - Automatic trend detection
   - Smart recommendations (currently heuristic, upgrade to LLM)

---

## Usage

### As a Manager
1. Click "Progress Timeline" tab
2. Review monthly completion percentages
3. Check "Capacity Utilization" for future planning
4. Read AI insights for team health indicators

### As a Team Lead
1. Track carried-over items across months
2. Monitor velocity trend for sprint planning
3. Identify bottlenecks from AI warnings
4. Use data for retrospectives

### As a Developer
1. See what's planned this month
2. Understand priority from month-by-month view
3. Track progress visually in MonthCard

---

## Future Enhancements

### Phase 2 (Real Data)
- [ ] Connect to MongoDB for actual task/epic data
- [ ] Integrate with Kanban board updates
- [ ] Real-time Socket.io sync

### Phase 3 (Advanced Analytics)
- [ ] OpenAI integration for insights
- [ ] Predictive burndown charts
- [ ] Team capacity forecasting (ML)
- [ ] Anomaly detection (velocity spikes/drops)

### Phase 4 (Team Features)
- [ ] Team comparison view (across projects)
- [ ] Historical trending (YoY analysis)
- [ ] Custom metric definitions
- [ ] Export to PDF/Excel reports

---

## Files Modified/Created

```
NEW FILES:
├── src/utils/monthlyProgressData.js (250 lines)
├── src/components/dashboards/MonthCard.jsx (190 lines)
├── src/components/dashboards/MonthCard.css (240 lines)
├── src/components/dashboards/MonthlyInsights.jsx (125 lines)
└── src/components/dashboards/MonthlyInsights.css (180 lines)

UPDATED FILES:
└── src/components/dashboards/RoadmapPage.jsx (Enhanced with tabs)
└── src/components/dashboards/RoadmapPage.css (Added month grid styles)
```

---

## Testing Checklist

- [ ] Monthly cards render correctly for all months
- [ ] Progress bars update with completion percentage
- [ ] Carried-over items display with reasons
- [ ] Velocity chart loads and displays data
- [ ] Capacity utilization shows correct percentages
- [ ] AI insights appear for all months
- [ ] Click handlers work on task items
- [ ] Responsive layout on mobile/tablet
- [ ] Tab switching works smoothly
- [ ] Time range filter updates display

---

## Support & Questions

For questions about the monthly progress roadmap implementation, refer to the component files:
- **Data Logic**: `monthlyProgressData.js`
- **UI Components**: `MonthCard.jsx`, `MonthlyInsights.jsx`
- **Styling**: `MonthCard.css`, `MonthlyInsights.css`
- **Integration**: `RoadmapPage.jsx`
