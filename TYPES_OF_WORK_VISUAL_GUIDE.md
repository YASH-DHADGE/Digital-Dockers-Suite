# Types of Work Widget - Visual Reference

## Card Layout

```
┌─────────────────────────────────────┐
│ Types of work                       │
│ Get a breakdown of work items by... │
├─────────────────────────────────────┤
│ Type              │  Distribution    │  (Header row)
├─────────────────────────────────────┤
│ ✓ Task            ███████████░░░ 86% │
├─────────────────────────────────────┤
│ ◆ Epic            ██░░░░░░░░░░░░ 14% │
├─────────────────────────────────────┤
│ 📄 Story          ░░░░░░░░░░░░░░  0% │
├─────────────────────────────────────┤
│ 🐛 Bug            ░░░░░░░░░░░░░░  0% │
├─────────────────────────────────────┤
│ 📋 Subtask        ░░░░░░░░░░░░░░  0% │
└─────────────────────────────────────┘
```

## Color Scheme

| Type     | Icon                     | Color    | Hex Code |
|----------|--------------------------|----------|----------|
| Task     | CheckSquareOutlined ✓    | Blue     | #0052cc  |
| Epic     | BgColorsOutlined ◆       | Purple   | #403294  |
| Story    | FileTextOutlined 📄      | Green    | #00875a  |
| Bug      | BugOutlined 🐛          | Red      | #ff5630  |
| Subtask  | CopyOutlined 📋          | Gray     | #8590a2  |

## Row Elements

```
┌────────────────────────────────────────────────────────────┐
│                                                            │
│  [ICON] Label  │  ████████░░░░░░░░░░  86%               │
│                                                            │
│  16px padding  │  12px gap                               │
│                                                            │
└────────────────────────────────────────────────────────────┘
```

### Element Breakdown

1. **Icon + Label** (Flex: 0.8)
   - Icon: 14px, type-specific color
   - Label: 12px bold, ellipsis for long names
   - Tooltip on hover

2. **Progress Bar** (Flex: 1.5)
   - Background: #dfe1e6 (light gray)
   - Fill: Type-specific color
   - Height: 8px
   - Border radius: 4px
   - Smooth animation: 0.4s ease

3. **Percentage** (40px fixed width)
   - Font: 12px bold
   - Right-aligned
   - Tooltip: "X of Y items"

## States

### Loading State
```
Card with Skeleton component:
- 5 rows of placeholder bars
- Shimmer animation
- Full-width skeleton blocks
```

### Empty State
```
┌─────────────────────────────────────┐
│ Types of work                       │
├─────────────────────────────────────┤
│                                     │
│      No work items found            │
│                                     │
└─────────────────────────────────────┘
```

### Error State
```
┌─────────────────────────────────────┐
│ Types of work                       │
├─────────────────────────────────────┤
│                                     │
│  Failed to load work types          │
│                                     │
└─────────────────────────────────────┘
```

## Responsive Behavior

**Desktop (lg):** 
- Full width in right column
- All text visible
- Normal spacing

**Tablet (md):**
- Labels may truncate
- Bars slightly compressed
- Responsive flex layout

**Mobile (xs):**
- Single column layout
- Icon + label stacked if needed
- Touch-friendly hover areas

## Interactions

### Hover
- Row background: transparent → #f6f8fa
- Cursor: pointer (if onClick handler present)
- Tooltip appears on icon/label/percentage

### Click
- Optional callback: `onTypeClick(rawType)`
- Can trigger filtering in issue list
- Extensible for future features

## Styling Properties

```css
Card:
  - boxShadow: 0 2px 8px rgba(0,0,0,0.06)
  - borderRadius: 8px
  - border: 1px solid #f0f0f0
  - bodyPadding: 16px 0 (top/bottom)

Row:
  - padding: 12px 16px
  - borderBottom: 1px solid #f0f0f0
  - gap: 12px
  - alignItems: center
  - transition: background 0.2s

Progress Bar:
  - backgroundColor: #dfe1e6
  - height: 8px
  - borderRadius: 4px
  - fill-transition: width 0.4s ease

Text:
  - title: 13px bold, #262626, fontWeight: 600
  - body: 12px, #262626
  - secondary: 11px, #626f86
  - uppercase: letterSpacing: 0.5px
```

## API Integration

```
Frontend Call:
GET /api/projects/{projectId}/work-types

Response:
[
  {
    "type": "Task",
    "rawType": "task",
    "count": 6,
    "percentage": 86
  },
  ...
]

Error Handling:
- Network error → Show error state
- 404 → Empty state
- 500 → Error message
```

## Dashboard Position

```
┌────────────────────────────┬──────────────────┐
│  Main Content (lg={16})     │  Right Bar (lg=8)│
│                            │                  │
│  - Burndown Chart          │  ✓ Status Oveview│
│  - Issue Status            │  ✓ Types of Work │ ← HERE
│  - Sprint Velocity         │  ✓ Upcoming Work │
│  - Team Workload           │                  │
│                            │                  │
└────────────────────────────┴──────────────────┘
```

---

**Visual Design:** Jira-standard, enterprise-grade
**Accessibility:** WCAG AA compliant
**Performance:** <100ms API response, smooth animations
**Responsive:** Mobile-first, desktop-optimized
