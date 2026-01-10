// ============================================================================
// SUBTASK FEATURE - COPY & PASTE READY EXAMPLES
// ============================================================================
// Use these examples to quickly integrate subtask functionality
// ============================================================================

/**
 * EXAMPLE 1: Add to Existing Task Detail Page
 * Copy this component and paste into your task detail page
 */

import React, { useState, useEffect } from 'react';
import axios from 'axios';
import SubTaskPanel from '@/components/SubTaskPanel';

export function YourTaskDetailPage({ taskId }) {
  const [task, setTask] = useState(null);

  useEffect(() => {
    fetchTask();
  }, [taskId]);

  const fetchTask = async () => {
    try {
      const res = await axios.get(`/api/tasks/${taskId}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      setTask(res.data.data);
    } catch (error) {
      console.error('Failed to load task:', error);
    }
  };

  if (!task) return <div>Loading...</div>;

  return (
    <div className="task-detail">
      <h1>{task.title}</h1>
      
      {/* JUST ADD THIS COMPONENT */}
      <SubTaskPanel
        parentTaskId={taskId}
        parentTask={task}
        onTaskUpdate={fetchTask}
      />
    </div>
  );
}

// ============================================================================
// EXAMPLE 2: Use Hook for Custom UI
// Build your own subtask UI with full control
// ============================================================================

import { useSubTasks } from '@/hooks/useSubTasks';

export function CustomSubTaskUI({ parentTaskId }) {
  const { children, stats, error, actions, isLoading } = useSubTasks(parentTaskId);

  return (
    <div className="custom-subtask-ui">
      {/* Show stats */}
      <div>
        <p>Total: {stats.total}</p>
        <p>Done: {stats.done}</p>
        <p>In Progress: {stats.inProgress}</p>
      </div>

      {/* Create button */}
      <button onClick={() => {
        actions.createSubtask({
          title: 'New subtask',
          description: 'Description',
          storyPoints: 5
        });
      }}>
        Create Subtask
      </button>

      {/* List children */}
      <ul>
        {children.map(child => (
          <li key={child._id}>
            {child.title}
            <select 
              value={child.status}
              onChange={(e) => actions.updateChildStatus(child._id, e.target.value)}
            >
              <option value="todo">To Do</option>
              <option value="in_progress">In Progress</option>
              <option value="done">Done</option>
            </select>
            <button onClick={() => actions.deleteChild(child._id)}>Delete</button>
          </li>
        ))}
      </ul>
    </div>
  );
}

// ============================================================================
// EXAMPLE 3: Create a Subtask Programmatically
// Use the hook to create subtasks from your own code
// ============================================================================

import { useSubTasks } from '@/hooks/useSubTasks';

export function QuickCreateSubtask({ parentTaskId }) {
  const { actions } = useSubTasks(parentTaskId);
  const [title, setTitle] = useState('');

  const handleCreate = async () => {
    try {
      await actions.createSubtask({
        title: title,
        storyPoints: 3,
        priority: 'medium'
      });
      setTitle(''); // Clear input
    } catch (error) {
      alert('Failed to create: ' + error.message);
    }
  };

  return (
    <div>
      <input 
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder="Subtask title"
      />
      <button onClick={handleCreate}>Create</button>
    </div>
  );
}

// ============================================================================
// EXAMPLE 4: Bulk Update Subtask Statuses
// Change all children to the same status
// ============================================================================

import { useSubTasks } from '@/hooks/useSubTasks';

export function BulkUpdateSubtasks({ parentTaskId }) {
  const { stats, actions } = useSubTasks(parentTaskId);

  const handleBulkUpdate = async (status) => {
    try {
      const result = await actions.bulkUpdateStatus(status);
      alert(`Updated ${result.updated} out of ${result.total} subtasks`);
    } catch (error) {
      alert('Failed: ' + error.message);
    }
  };

  return (
    <div>
      <p>Total subtasks: {stats.total}</p>
      <button onClick={() => handleBulkUpdate('done')}>Mark All Done</button>
      <button onClick={() => handleBulkUpdate('todo')}>Mark All To Do</button>
      <button onClick={() => handleBulkUpdate('in_progress')}>Mark All In Progress</button>
    </div>
  );
}

// ============================================================================
// EXAMPLE 5: API Call Examples (Raw Axios)
// If you want to make direct API calls without the hook
// ============================================================================

// Create a subtask
async function createSubtask(parentId, data) {
  const response = await axios.post(
    `/api/work-items/${parentId}/subtasks`,
    {
      title: 'My subtask',
      description: 'Description',
      storyPoints: 5,
      assignedTo: 'user-id-optional',
      priority: 'medium',
      dueDate: '2026-02-28'
    },
    {
      headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
    }
  );
  return response.data.data; // Returns created subtask
}

// Get subtasks with pagination
async function getSubtasks(parentId, page = 1) {
  const response = await axios.get(
    `/api/work-items/${parentId}/subtasks`,
    {
      params: {
        skip: (page - 1) * 50,
        limit: 50,
        sortBy: 'createdAt'
      },
      headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
    }
  );
  return {
    children: response.data.children,
    total: response.data.total,
    hasMore: response.data.hasMore
  };
}

// Update subtask status
async function updateSubtaskStatus(childId, newStatus) {
  const response = await axios.patch(
    `/api/work-items/${childId}/status`,
    { status: newStatus },
    {
      headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
    }
  );
  return {
    child: response.data.child,
    parent: response.data.parent // Parent might have auto-updated
  };
}

// Delete subtask
async function deleteSubtask(childId) {
  const response = await axios.delete(
    `/api/work-items/${childId}`,
    {
      headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
    }
  );
  return response.data.message;
}

// Get story points breakdown
async function getStoryPoints(parentId) {
  const response = await axios.get(
    `/api/work-items/${parentId}/story-points`,
    {
      headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
    }
  );
  return {
    own: response.data.own,
    children: response.data.children,
    total: response.data.total
  };
}

// ============================================================================
// EXAMPLE 6: Integrate into React Router
// Add subtask feature to your routing
// ============================================================================

import { BrowserRouter, Routes, Route } from 'react-router-dom';
import TaskDetailExample from '@/pages/TaskDetailExample';

export function AppRouter() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Use pre-built example page */}
        <Route 
          path="/tasks/:taskId" 
          element={<TaskDetailExample taskId={taskId} />} 
        />
        
        {/* Or use your custom page */}
        <Route 
          path="/tasks/:taskId"
          element={<YourTaskDetailPage taskId={taskId} />}
        />
      </Routes>
    </BrowserRouter>
  );
}

// ============================================================================
// EXAMPLE 7: Error Handling Best Practices
// ============================================================================

import { useSubTasks } from '@/hooks/useSubTasks';

export function SafeSubTaskManager({ parentTaskId }) {
  const { children, error, actions, isLoading } = useSubTasks(parentTaskId);

  const handleUpdateStatus = async (childId, newStatus) => {
    try {
      const result = await actions.updateChildStatus(childId, newStatus);
      console.log('Status updated:', result);
      // Show success message
    } catch (error) {
      // Error is already set in hook
      console.error('Update failed:', error);
      // Show error to user: error.message
    }
  };

  const handleDelete = async (childId) => {
    // Always confirm before deleting
    if (!window.confirm('Delete this subtask?')) {
      return;
    }

    try {
      await actions.deleteChild(childId);
      // Show success
    } catch (error) {
      console.error('Delete failed:', error);
      // Show error
    }
  };

  return (
    <div>
      {error && (
        <div className="error-banner">
          {error}
          <button onClick={() => actions.clearError()}>Dismiss</button>
        </div>
      )}

      {isLoading && <div>Loading subtasks...</div>}

      <ul>
        {children.map(child => (
          <li key={child._id}>
            {child.title}
            <select 
              disabled={isLoading}
              value={child.status}
              onChange={(e) => handleUpdateStatus(child._id, e.target.value)}
            >
              <option value="todo">To Do</option>
              <option value="in_progress">In Progress</option>
              <option value="done">Done</option>
            </select>
            <button 
              disabled={isLoading}
              onClick={() => handleDelete(child._id)}
            >
              Delete
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}

// ============================================================================
// EXAMPLE 8: TypeScript Types (Optional)
// If you're using TypeScript
// ============================================================================

interface SubTask {
  _id: string;
  title: string;
  description?: string;
  status: 'todo' | 'in_progress' | 'in_review' | 'done';
  storyPoints: number;
  priority?: 'low' | 'medium' | 'high' | 'critical';
  assignedTo?: { _id: string; name: string; email: string };
  parentTask: string;
  issueKey: string;
  createdAt: Date;
  updatedAt: Date;
}

interface SubTaskStats {
  total: number;
  done: number;
  inProgress: number;
  pending: number;
}

interface StoryPointsBreakdown {
  own: number;
  children: number;
  total: number;
  hasChildren: boolean;
}

interface UseSubTasksReturn {
  children: SubTask[];
  stats: SubTaskStats;
  storyPoints: StoryPointsBreakdown;
  error: string | null;
  isLoading: boolean;
  actions: {
    fetchChildren: () => Promise<void>;
    updateChildStatus: (id: string, status: SubTask['status']) => Promise<void>;
    deleteChild: (id: string) => Promise<void>;
    createSubtask: (data: Partial<SubTask>) => Promise<SubTask>;
    clearError: () => void;
  };
}

// ============================================================================
// EXAMPLE 9: Styling Integration
// How to apply styles to your pages
// ============================================================================

// In your page component, import the styles:
import '@/styles/SubTaskPanel.css';
import '@/styles/SubTaskCreationModal.css';
import '@/styles/TaskDetailExample.css';

// Or use CSS modules (if configured):
import styles from '@/styles/SubTaskPanel.module.css';

// Then apply classes:
<div className={styles.subtaskPanel}>
  <SubTaskPanel ... />
</div>

// ============================================================================
// EXAMPLE 10: State Management Integration
// If using Redux or other state managers
// ============================================================================

// Redux Action to load subtasks
export async function loadSubtasks(parentId) {
  try {
    const response = await axios.get(`/api/work-items/${parentId}/subtasks`, {
      headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
    });
    
    dispatch({
      type: 'SET_SUBTASKS',
      payload: {
        children: response.data.children,
        stats: {
          total: response.data.total,
          done: response.data.children.filter(c => c.status === 'done').length,
          // ... etc
        }
      }
    });
  } catch (error) {
    dispatch({ type: 'SET_ERROR', payload: error.message });
  }
}

// ============================================================================
// QUICK COPY-PASTE INTEGRATION
// ============================================================================

/* 
 * FASTEST WAY TO GET STARTED:
 * 
 * 1. Copy this into your task detail page:
 */

import SubTaskPanel from '@/components/SubTaskPanel';

// Inside your component JSX:
<SubTaskPanel
  parentTaskId={task._id}
  parentTask={task}
  onTaskUpdate={() => refetchTask()}
/>

/*
 * 2. That's it! The subtask feature is now live.
 * 
 * Users can:
 * ✓ Click arrow to expand subtasks
 * ✓ Click "+ Add Sub-Task" to create
 * ✓ Change status via dropdown
 * ✓ Delete with confirmation
 * ✓ Use keyboard shortcuts (↑↓, Enter, Delete)
 * ✓ Drag to reorder
 */

// ============================================================================
// END OF EXAMPLES
// ============================================================================

export default {
  message: 'See examples above for implementation patterns'
};
