# Dark Mode QA Matrix (Dashboard Routes)

Date: 2026-04-12
Scope: `/dashboard/*` routes from `frontend/src/App.jsx`
Method: static UI audit + inline-style sweep (no authenticated runtime screenshot pass)

## Checklist Legend
- Toggle wiring: route or child tree reads `useThemeMode`, `theme.palette.mode`, or CSS `.dark` tokens.
- Inline styles: no light-only inline style objects left unguarded.
- Surface/text contrast: card/surface + text styles are dark-safe by code path.
- Visual pass: `Code` means static pass only; `Manual` still recommended in browser.

| Route | Entry Component | Toggle Wiring | Inline Styles | Surface/Text | Visual Pass | Status | Notes |
|---|---|---|---|---|---|---|---|
| `/dashboard` | `DashboardHome` | Yes | Mostly Yes | Mostly Yes | Code | Pass | Dashboard widgets now mostly token/theme-driven; small legacy literals remain in a few child widgets but are guarded. |
| `/dashboard/tasks` | `TasksPage` | Partial | Yes | Partial | Code | Partial | Route has low inline risk, but CSS-heavy board files still need full manual contrast sweep. |
| `/dashboard/backlog` | `BacklogPage` | Yes | Yes | Yes | Code | Pass | Drag-over inline background now dark-aware. |
| `/dashboard/roadmap` | `pages/RoadmapPage` | Yes | Yes | Yes | Code | Pass | Chart tooltip and KPI/card surfaces already dual-mode. |
| `/dashboard/meetings` | `MeetingsPage` | Partial | Yes | Partial | Code | Partial | No obvious inline light literals; verify modals/cards manually. |
| `/dashboard/email-generator` | `EmailGeneratorPage` | Yes | Yes | Partial | Code | Partial | Theme wiring exists; manual pass needed for generated content blocks. |
| `/dashboard/ppt-generator` | `PPTGeneratorPage` | Partial | Yes | Partial | Code | Partial | No inline light literals detected in route file; verify child styles manually. |
| `/dashboard/documents` | `DocumentManager` | Partial | Yes | Partial | Code | Partial | Route file clean; verify drawer/table contrast manually. |
| `/dashboard/wellness` | `WellnessCheckin` | Yes | Yes | Mostly Yes | Code | Pass | Existing dark polish is present; run interaction check manually. |
| `/dashboard/reports` | `ReportDashboard` | Yes | Yes | Yes | Code | Pass | Remaining inline muted text converted to dark-aware values. |
| `/dashboard/settings` | `SettingsPage` | Yes | Yes | Mostly Yes | Code | Pass | No inline light-only style hotspots found. |
| `/dashboard/profile` | `ProfilePage` | Partial | Yes | Partial | Code | Partial | Route file clean; verify avatar/forms contrast manually. |
| `/dashboard/chat` | `ChatPage` | Partial | Yes | Partial | Code | Partial | Route-level styles appear clean; chat CSS requires runtime visual check. |
| `/dashboard/organization` | `OrgGraph` | Yes | Yes | Yes | Code | Pass | ReactFlow handle borders switched to theme-aware values. |
| `/dashboard/projects` | `ProjectsListPage` | Yes | Yes | Mostly Yes | Code | Pass | Route file has dark-aware gradients/tokens. |
| `/dashboard/spaces` | `Spaces` | Yes | Yes | Yes | Code | Pass | Empty state and members/comments inline surfaces now dark-aware. |
| `/dashboard/work-planner` | `CalendarWorkPlanner` | Partial | Yes | Yes | Code | Pass | CSS dark override block added for planner/day/work item surfaces. |
| `/dashboard/tech-debt` | `TechDebtPage` | Yes | Yes | Yes | Code | Pass | Route and key child modals/cards now dark-capable. |
| `/dashboard/ai-architect` | `AIArchitectPage` | Yes | Yes | Partial | Code | Partial | Route header text is dark-aware; several nested panel components still contain legacy inline light literals and need next pass. |
| `/dashboard/team-management` | `TeamManagement` | Yes | Yes | Mostly Yes | Code | Pass | Members/add-user panel borders and muted text now dark-aware. |

## Inline-Style Sweep Summary
Patched in this pass:
- `frontend/src/components/backlog/BacklogPage.jsx`
- `frontend/src/components/reports/ReportDashboard.jsx`
- `frontend/src/components/reports/AIReportGenerator.jsx`
- `frontend/src/components/dashboards/StatusOverview.jsx`
- `frontend/src/components/dashboards/RoadmapPage.jsx`
- `frontend/src/components/spaces/Spaces.jsx`
- `frontend/src/components/spaces/SpaceMembers.jsx`
- `frontend/src/components/spaces/SpaceComments.jsx`
- `frontend/src/components/org/OrgGraph.jsx`
- `frontend/src/components/admin/TeamManagement.jsx`
- `frontend/src/components/dashboards/ProjectDashboard.jsx`
- `frontend/src/components/dashboards/TypesOfWorkCard.jsx`
- `frontend/src/pages/AIArchitectPage.jsx`

## Residual Risk Buckets
1. AI Architect nested panels still contain several hardcoded light inline card backgrounds (formation/reallocation panels).
2. CSS-heavy legacy boards (`tasks`, some chat/widgets) rely more on stylesheet coverage than route-level inline styling.
3. This matrix is code-driven; final sign-off should include manual browser checks on each route with both themes.
