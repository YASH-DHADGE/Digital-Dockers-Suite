/**
 * SUBTASK FEATURE - INTEGRATION GUIDE
 * ===================================
 * 
 * This guide shows how to use all the subtask components and features
 * that have been implemented in your application.
 */

// ============================================================================
// 1. BASIC USAGE - Using SubTaskPanel in Your Components
// ============================================================================

import SubTaskPanel from '@/components/SubTaskPanel';

function MyDetailPage({ taskId, taskData }) {
  const handleTaskUpdate = () => {
    // Refresh parent component data if needed
    console.log('Task was updated via subtask operations');
  };

  return (
    <div>
      <h1>{taskData.title}</h1>
      
      {/* Integrate SubTaskPanel to show/manage subtasks */}
      <SubTaskPanel
        parentTaskId={taskId}
        parentTask={taskData}
        onTaskUpdate={handleTaskUpdate}
      />
    </div>
  );
}

// ============================================================================
// 2. USING THE useSubTasks HOOK - Direct Control
// ============================================================================

import { useSubTasks } from '@/hooks/useSubTasks';

function CustomSubTaskManager({ parentTaskId }) {
  const { children, stats, error, actions, isLoading } = useSubTasks(parentTaskId);

  const handleCreateChild = async () => {
    try {
      await actions.createSubtask({
        title: 'New subtask',
        description: 'Description here',
        storyPoints: 5
      });
      console.log('Subtask created!');
    } catch (err) {
      console.error('Failed:', err);
    }
  };

  const handleUpdateStatus = async (childId, newStatus) => {
    try {
      await actions.updateChildStatus(childId, newStatus);
      // Parent auto-updates automatically
    } catch (err) {
      console.error('Failed:', err);
    }
  };

  const handleDeleteChild = async (childId) => {
    try {
      await actions.deleteChild(childId);
    } catch (err) {
      console.error('Failed:', err);
    }
  };

  const handleMove = async (childId, newParentId) => {
    try {
      await actions.moveChild(childId, newParentId);
    } catch (err) {
      console.error('Failed:', err);
    }
  };

  return (
    <div>
      <p>Total: {stats.total}, Done: {stats.done}</p>
      <button onClick={handleCreateChild}>Create Subtask</button>
      {error && <p>Error: {error}</p>}
      {/* Rest of your custom UI */}
    </div>
  );
}

// ============================================================================
// 3. AVAILABLE API ENDPOINTS
// ============================================================================

/*
 * POST /api/work-items/:parentId/subtasks
 * Create a new subtask
 * 
 * Body: {
 *   title: string (required),
 *   description: string (optional),
 *   storyPoints: number (0-100),
 *   assignedTo: string (optional),
 *   priority: 'low' | 'medium' | 'high' | 'critical',
 *   dueDate: date (optional)
 * }
 * 
 * Response: { success: true, data: { _id, title, status, ... } }
 */

/*
 * GET /api/work-items/:parentId/subtasks
 * Get all children of a parent task
 * 
 * Query params:
 *   skip: number (default: 0)
 *   limit: number (default: 50)
 *   status: 'todo' | 'in_progress' | 'in_review' | 'done' (optional)
 *   sortBy: 'createdAt' | 'dueDate' | 'storyPoints' (default: 'createdAt')
 * 
 * Response: { 
 *   success: true, 
 *   children: [...],
 *   total: number,
 *   skip: number,
 *   limit: number,
 *   hasMore: boolean
 * }
 */

/*
 * GET /api/work-items/:parentId/story-points
 * Get story points breakdown (own + children)
 * 
 * Response: {
 *   success: true,
 *   own: number,
 *   children: number,
 *   total: number,
 *   hasChildren: boolean
 * }
 */

/*
 * GET /api/work-items/:parentId/hierarchy
 * Get parent task plus all children
 * 
 * Response: {
 *   success: true,
 *   item: { ...parent task... },
 *   parent: null or { ...parent of parent... },
 *   children: [ ...array of children... ]
 * }
 */

/*
 * PATCH /api/work-items/:childId/status
 * Update child status (parent auto-updates)
 * 
 * Body: {
 *   status: 'todo' | 'in_progress' | 'in_review' | 'done'
 * }
 * 
 * Response: {
 *   success: true,
 *   child: { ...updated child... },
 *   parent: { ...auto-updated parent... }
 * }
 */

/*
 * POST /api/work-items/:childId/move/:newParentId
 * Move subtask to different parent
 * 
 * Response: { success: true, data: { ...moved subtask... } }
 */

/*
 * POST /api/work-items/:childId/detach
 * Detach subtask from parent (make it standalone)
 * 
 * Response: { success: true, data: { ...updated subtask... } }
 */

/*
 * DELETE /api/work-items/:id
 * Delete a work item (blocked if has children)
 * 
 * Response: { success: true, message: "..." }
 */

/*
 * DELETE /api/work-items/:id/validate-delete
 * Pre-check if item can be deleted
 * 
 * Response: {
 *   success: true,
 *   canDelete: boolean,
 *   childCount: number,
 *   message: string
 * }
 */

/*
 * POST /api/work-items/:parentId/subtasks/bulk-status
 * Update all children to same status
 * 
 * Body: {
 *   status: 'todo' | 'in_progress' | 'in_review' | 'done'
 * }
 * 
 * Response: {
 *   success: true,
 *   updated: number,
 *   total: number
 * }
 */

/*
 * POST /api/work-items/validate-relationship
 * Pre-flight check before creating relationship
 * 
 * Body: {
 *   parentId: string,
 *   childId: string
 * }
 * 
 * Response: {
 *   success: true,
 *   valid: boolean,
 *   errors: [ ...list of errors if any... ]
 * }
 */

// ============================================================================
// 4. KEYBOARD SHORTCUTS (Built into SubTaskPanel)
// ============================================================================

/*
 * When focused on a subtask item:
 * 
 * Arrow Up (↑)     - Navigate to previous subtask
 * Arrow Down (↓)   - Navigate to next subtask
 * Enter            - Toggle subtask details/expand
 * Delete           - Delete focused subtask
 * Escape (Esc)     - Clear selection/focus
 * Drag             - Drag to reorder subtasks
 * 
 * When focused on panel header:
 * Enter            - Expand/collapse subtask list
 * Space            - Expand/collapse subtask list
 */

// ============================================================================
// 5. PARENT STATUS AUTO-UPDATE RULES
// ============================================================================

/*
 * When children statuses change, parent auto-updates:
 * 
 * ✓ If ALL children are 'done'   → Parent becomes 'done'
 * ✓ If ANY child is 'in_progress'  → Parent becomes 'in_progress'
 * ✓ If ANY child is 'in_review'    → Parent becomes 'in_review'
 * ✓ Otherwise                      → Parent becomes 'todo'
 * 
 * Cannot move parent to 'done' if any child is not 'done'
 * Cannot delete parent if it has children
 */

// ============================================================================
// 6. VALIDATION RULES (Enforced at All Layers)
// ============================================================================

/*
 * Subtask Constraints:
 * ✓ Subtask must have a parent
 * ✓ Parent cannot be an epic
 * ✓ Maximum nesting depth = 1 (no nested subtasks)
 * ✓ Parent cannot have status 'subtask'
 * ✓ Story points: 0-100
 * ✓ Title required, max 255 characters
 * ✓ Description optional, max 2000 characters
 */

// ============================================================================
// 7. COMPLETE EXAMPLE - Full Task Detail Page
// ============================================================================

import React, { useState, useEffect } from 'react';
import SubTaskPanel from '@/components/SubTaskPanel';
import TaskDetailExample from '@/pages/TaskDetailExample';

// Option 1: Use the pre-built example page
export function MyPage() {
  return <TaskDetailExample taskId="some-task-id" />;
}

// Option 2: Build your own
export function CustomTaskDetail({ taskId }) {
  const [task, setTask] = useState(null);

  useEffect(() => {
    fetchTask();
  }, [taskId]);

  const fetchTask = async () => {
    const response = await axios.get(`/api/tasks/${taskId}`, {
      headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
    });
    if (response.data.success) {
      setTask(response.data.data);
    }
  };

  if (!task) return <div>Loading...</div>;

  return (
    <div>
      <h1>{task.title}</h1>
      <p>{task.description}</p>
      
      {/* Integrate SubTaskPanel here */}
      <SubTaskPanel
        parentTaskId={taskId}
        parentTask={task}
        onTaskUpdate={fetchTask}  // Refresh when subtasks change
      />
    </div>
  );
}

// ============================================================================
// 8. FEATURES SUMMARY
// ============================================================================

/*
 * ✅ Subtask Management:
 *    - Create, read, update, delete subtasks
 *    - Move subtasks between parents
 *    - Detach subtasks (make standalone)
 *    - Bulk operations on all children
 * 
 * ✅ Parent Auto-Update:
 *    - Status cascades from children to parent
 *    - Story points aggregate automatically
 *    - Prevents invalid parent states
 * 
 * ✅ User Interface:
 *    - Expand/collapse subtask list
 *    - Visual hierarchy with nesting
 *    - Real-time status updates
 *    - Progress bar showing completion %
 *    - Story points breakdown (own + children)
 * 
 * ✅ Drag & Drop:
 *    - Drag subtasks to reorder
 *    - Visual feedback during drag
 *    - Infrastructure ready for custom reordering API
 * 
 * ✅ Keyboard Accessibility:
 *    - Arrow key navigation
 *    - Enter to toggle details
 *    - Delete to remove items
 *    - ARIA labels and roles
 *    - Tab navigation support
 *    - Keyboard shortcut help
 * 
 * ✅ Error Handling:
 *    - Validation at model, service, and API layers
 *    - Descriptive error messages
 *    - Network error recovery
 *    - Confirmation dialogs for destructive actions
 * 
 * ✅ Performance:
 *    - MongoDB compound indexes
 *    - Pagination support (50 items per page)
 *    - Lazy loading on expand
 *    - Optimistic UI updates
 *    - AbortController for request cancellation
 * 
 * ✅ Data Consistency:
 *    - MongoDB transactions for atomicity
 *    - Pre-save validation middleware
 *    - Cascade safety (prevents orphaning)
 *    - Audit logging support
 */

// ============================================================================
// 9. FILE LOCATIONS
// ============================================================================

/*
 * Frontend Components:
 *   - /src/components/SubTaskPanel.jsx
 *   - /src/components/SubTaskCreationModal.jsx
 *   - /src/pages/TaskDetailExample.jsx
 * 
 * Frontend Hooks:
 *   - /src/hooks/useSubTasks.js
 * 
 * Frontend Styles:
 *   - /src/styles/SubTaskPanel.css
 *   - /src/styles/SubTaskCreationModal.css
 *   - /src/styles/TaskDetailExample.css
 * 
 * Backend Models:
 *   - /backend/models/Task.js (enhanced)
 *   - /backend/models/ActivityLog.js (updated)
 * 
 * Backend Services:
 *   - /backend/services/workItemService.js
 * 
 * Backend Routes:
 *   - /backend/routes/subtaskRoutes.js
 * 
 * Backend Integration:
 *   - /backend/server.js (routes registered)
 */

// ============================================================================
// 10. NEXT STEPS
// ============================================================================

/*
 * Optional Enhancements:
 * 
 * 1. Add Real-Time Updates:
 *    - Integrate WebSocket for live subtask changes
 *    - Update component when other users modify subtasks
 * 
 * 2. Advanced Filtering:
 *    - Filter by assignee, priority, due date
 *    - Search within subtask titles
 *    - Custom sorting options
 * 
 * 3. Batch Operations:
 *    - Select multiple subtasks
 *    - Bulk status updates
 *    - Bulk assign to user
 *    - Bulk delete with confirmation
 * 
 * 4. Analytics:
 *    - Burndown charts for subtasks
 *    - Velocity tracking
 *    - Completion trends
 * 
 * 5. Notifications:
 *    - Notify when subtask status changes
 *    - Alert on overdue subtasks
 *    - Remind about incomplete subtasks
 * 
 * 6. Custom Fields:
 *    - Add custom fields to subtasks
 *    - Store field values in metadata
 *    - Display in subtask cards
 */

export default {
  guide: 'See inline documentation above'
};
