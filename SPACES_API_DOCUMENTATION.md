# Spaces Feature - Complete API Documentation

## Overview
Spaces is a collaborative workspace feature within projects, supporting real-time Notes, Whiteboard, and Mind Map editing. This document covers all REST API endpoints and WebSocket events.

---

## Table of Contents
1. [Space Management APIs](#space-management-apis)
2. [Content APIs](#content-apis)
3. [Member Management APIs](#member-management-apis)
4. [WebSocket Events](#websocket-events)
5. [Data Models](#data-models)
6. [Error Handling](#error-handling)
7. [Real-Time Collaboration](#real-time-collaboration)

---

## Space Management APIs

### Create Space
```
POST /api/spaces
Content-Type: application/json
Authorization: Bearer {token}

{
  "projectId": "projectId",
  "title": "Sprint Planning",
  "description": "Notes from sprint planning meeting",
  "defaultContentType": "TEXT" // TEXT | WHITEBOARD | MINDMAP
}

Response (201):
{
  "success": true,
  "data": {
    "_id": "spaceId",
    "project": "projectId",
    "title": "Sprint Planning",
    "description": "...",
    "createdBy": { "name": "John", "avatar": "..." },
    "defaultContentType": "TEXT",
    "versionCount": 1,
    "contributorCount": 1,
    "currentMembers": 1,
    "content": { ... }
  }
}
```

### Get Spaces for Project
```
GET /api/spaces/project/:projectId?archived=false&sort=-createdAt
Authorization: Bearer {token}

Response (200):
{
  "success": true,
  "data": [
    {
      "_id": "spaceId",
      "title": "Sprint Planning",
      "description": "...",
      "defaultContentType": "TEXT",
      "createdBy": { "name": "John", "avatar": "..." },
      "members": [
        {
          "id": "userId",
          "name": "John",
          "role": "OWNER",
          "avatar": "..."
        }
      ],
      "userRole": "OWNER",
      "canEdit": true,
      "versionCount": 5,
      "contributorCount": 2
    }
  ],
  "total": 1
}
```

### Get Single Space
```
GET /api/spaces/:spaceId
Authorization: Bearer {token}

Response (200):
{
  "success": true,
  "data": {
    "_id": "spaceId",
    "title": "Sprint Planning",
    "description": "...",
    "createdBy": { "name": "John", "avatar": "..." },
    "updatedBy": { "name": "Jane", "avatar": "..." },
    "allowComments": true,
    "content": {
      "_id": "contentId",
      "space": "spaceId",
      "contentType": "TEXT",
      "textContent": "# Meeting Notes\n...",
      "version": 5,
      "updatedBy": { "name": "Jane", "avatar": "..." },
      "createdAt": "2025-01-10T12:00:00Z"
    },
    "members": [
      {
        "id": "userId",
        "name": "John",
        "role": "OWNER",
        "avatar": "...",
        "lastAccessedAt": "2025-01-10T14:30:00Z",
        "contributionCount": 12
      }
    ],
    "userRole": "OWNER",
    "userPermissions": {
      "canView": true,
      "canEdit": true,
      "canDelete": true,
      "canManageMembers": true,
      "canComment": true,
      "canChangeContent": true
    }
  }
}
```

### Update Space Metadata
```
PATCH /api/spaces/:spaceId
Content-Type: application/json
Authorization: Bearer {token}

{
  "title": "Updated Title",
  "description": "Updated description",
  "isArchived": false,
  "allowComments": true
}

Response (200): { "success": true, "data": { ... } }
```

### Archive/Delete Space
```
DELETE /api/spaces/:spaceId
Authorization: Bearer {token}

Response (200):
{
  "success": true,
  "message": "Space archived successfully",
  "data": { ... }
}
```

---

## Content APIs

### Update Content
```
PATCH /api/spaces/:spaceId/content
Content-Type: application/json
Authorization: Bearer {token}

{
  "contentType": "TEXT",
  "contentJson": { "blocks": [...] },
  "textContent": "# Updated notes...",
  "drawingData": { ... }, // For WHITEBOARD
  "mindmapData": { nodes: [...], edges: [...] }, // For MINDMAP
  "editSummary": "Added sprint timeline",
  "isMajorVersion": true
}

Response (200):
{
  "success": true,
  "data": {
    "_id": "contentId",
    "version": 6,
    "previousVersion": 5,
    "textContent": "# Updated notes...",
    "isMajorVersion": true,
    "isAutoSave": false,
    "updatedBy": "userId",
    "createdAt": "2025-01-10T14:35:00Z"
  }
}
```

### Autosave Content
```
POST /api/spaces/:spaceId/autosave
Content-Type: application/json
Authorization: Bearer {token}

{
  "contentJson": { ... },
  "textContent": "Current draft...",
  "drawingData": { ... },
  "mindmapData": { ... }
}

Response (200):
{
  "success": true,
  "data": {
    "version": 7,
    "savedAt": "2025-01-10T14:38:00Z",
    "isMajorVersion": false
  }
}
```

### Get Version History
```
GET /api/spaces/:spaceId/versions?limit=50&skip=0
Authorization: Bearer {token}

Response (200):
{
  "success": true,
  "data": [
    {
      "_id": "contentId",
      "version": 6,
      "textContent": "...",
      "editSummary": "Added sprint timeline",
      "updatedBy": { "name": "John", "avatar": "..." },
      "isMajorVersion": true,
      "createdAt": "2025-01-10T14:35:00Z"
    }
  ],
  "pagination": {
    "total": 12,
    "limit": 50,
    "skip": 0,
    "hasMore": false
  }
}
```

### Revert to Version
```
POST /api/spaces/:spaceId/versions/:versionId/revert
Authorization: Bearer {token}

Response (200):
{
  "success": true,
  "data": {
    "_id": "newContentId",
    "version": 7,
    "textContent": "...",
    "editSummary": "Reverted to version 5",
    "isMajorVersion": true
  }
}
```

### Get Content Diff
```
GET /api/spaces/:spaceId/content/diff/:v1/:v2
Authorization: Bearer {token}

Response (200):
{
  "success": true,
  "data": {
    "v1": 3,
    "v2": 5,
    "changes": {
      "textContent": {
        "from": "Old content",
        "to": "New content"
      },
      "editSummary": "Updated timeline",
      "editedBy": "userId",
      "editedAt": "2025-01-10T14:30:00Z"
    }
  }
}
```

---

## Member Management APIs

### Get Space Members
```
GET /api/spaces/:spaceId/members
Authorization: Bearer {token}

Response (200):
{
  "success": true,
  "data": [
    {
      "id": "memberId",
      "user": {
        "id": "userId",
        "name": "John",
        "email": "john@company.com",
        "avatar": "..."
      },
      "role": "OWNER",
      "permissions": {
        "canView": true,
        "canEdit": true,
        "canDelete": true,
        "canManageMembers": true,
        "canComment": true,
        "canChangeContent": true
      },
      "lastAccessedAt": "2025-01-10T14:30:00Z",
      "lastEditedAt": "2025-01-10T14:25:00Z",
      "contributionCount": 12,
      "joinedAt": "2025-01-10T10:00:00Z"
    }
  ]
}
```

### Add Member
```
POST /api/spaces/:spaceId/members
Content-Type: application/json
Authorization: Bearer {token}

{
  "userId": "userId",
  "role": "EDITOR" // OWNER | EDITOR | COMMENTER | VIEWER
}

Response (201):
{
  "success": true,
  "data": {
    "id": "memberId",
    "user": {
      "id": "userId",
      "name": "John",
      "email": "john@company.com",
      "avatar": "..."
    },
    "role": "EDITOR",
    "permissions": { ... },
    "addedAt": "2025-01-10T15:00:00Z"
  }
}
```

### Update Member Role
```
PATCH /api/spaces/:spaceId/members/:memberId
Content-Type: application/json
Authorization: Bearer {token}

{
  "role": "EDITOR"
}

Response (200):
{
  "success": true,
  "data": {
    "role": "EDITOR",
    "permissions": { ... }
  }
}
```

### Remove Member
```
DELETE /api/spaces/:spaceId/members/:memberId
Authorization: Bearer {token}

Response (200):
{
  "success": true,
  "message": "Member removed"
}
```

---

## WebSocket Events

### Connection Setup
```javascript
// Connect with authentication
const socket = io(wsUrl, {
  auth: { token: localStorage.getItem('token') }
});

// Join space
socket.emit('space:join', {
  spaceId: 'spaceId',
  userId: 'userId'
});

// Listen for join confirmation
socket.on('space:joined', (data) => {
  console.log('Active users:', data.activeUsers);
  console.log('Active count:', data.activeCount);
});
```

### User Presence Events
```javascript
// User joined
socket.on('user:joined', (data) => {
  // { userId, activeCount, timestamp }
});

// User left
socket.on('user:left', (data) => {
  // { userId, activeCount }
});

// Update presence info
socket.emit('presence:update', {
  spaceId, userId,
  name: 'John Doe',
  avatar: 'https://...',
  color: '#0052cc'
});

socket.on('presence:updated', (data) => {
  // { userId, name, avatar, color, timestamp }
});
```

### Real-Time Content Updates
```javascript
// Send content update
socket.emit('content:update', {
  spaceId, userId,
  contentType: 'TEXT',
  textContent: 'Updated content',
  contentJson: { ... },
  drawingData: { ... },
  mindmapData: { ... }
});

// Receive content updates from others
socket.on('content:updated', (data) => {
  // { userId, contentType, textContent, drawingData, mindmapData, timestamp }
});
```

### Cursor & Drawing Collaboration
```javascript
// Send cursor position (for collaborative drawing)
socket.emit('cursor:move', {
  spaceId, userId,
  x: 100,
  y: 200,
  elementId: 'element-123',
  mode: 'draw' // 'draw' | 'select' | 'text'
});

// Receive cursor updates from others
socket.on('cursor:moved', (data) => {
  // { userId, x, y, elementId, mode, timestamp }
});

// Select element (prevent conflicts)
socket.emit('element:select', {
  spaceId, userId,
  elementId: 'element-123',
  isSelected: true
});

socket.on('lock:denied', (data) => {
  // { elementId, lockedBy, message }
});

socket.on('element:selected', (data) => {
  // { elementId, userId, isSelected, timestamp }
});

socket.on('element:deselected', (data) => {
  // { elementId, userId, timestamp }
});
```

### Typing Indicators
```javascript
// Send typing status
socket.emit('user:typing', {
  spaceId, userId,
  isTyping: true
});

// Receive typing status
socket.on('user:typing', (data) => {
  // { userId, isTyping, timestamp }
});
```

### Full Sync
```javascript
// Request full state sync (after reconnect)
socket.emit('sync:request', { spaceId, userId });

// Receive full sync
socket.on('sync:full', (data) => {
  // { content, space, activeUsers, version, timestamp }
});
```

### Connection Management
```javascript
// Heartbeat to keep connection alive
socket.emit('ping');
socket.on('pong', (data) => {
  // { timestamp }
});

// Leave space
socket.emit('space:leave', { spaceId, userId });

// Disconnect
socket.disconnect();
```

---

## Data Models

### Space
```javascript
{
  _id: ObjectId,
  project: ObjectId,
  title: String,
  description: String,
  createdBy: ObjectId,
  updatedBy: ObjectId,
  defaultContentType: 'TEXT' | 'WHITEBOARD' | 'MINDMAP',
  isPublic: Boolean,
  allowComments: Boolean,
  maxCollaborators: Number,
  contributorCount: Number,
  viewCount: Number,
  versionCount: Number,
  isArchived: Boolean,
  createdAt: DateTime,
  updatedAt: DateTime
}
```

### SpaceContent
```javascript
{
  _id: ObjectId,
  space: ObjectId,
  contentType: 'TEXT' | 'WHITEBOARD' | 'MINDMAP',
  contentJson: Mixed,
  textContent: String,
  drawingData: Mixed,
  mindmapData: {
    nodes: [{
      id: String,
      label: String,
      x: Number,
      y: Number,
      children: [String]
    }],
    edges: [{
      id: String,
      from: String,
      to: String
    }]
  },
  version: Number,
  previousVersion: ObjectId,
  updatedBy: ObjectId,
  editSummary: String,
  isMajorVersion: Boolean,
  isAutoSave: Boolean,
  createdAt: DateTime,
  updatedAt: DateTime
}
```

### SpaceMember
```javascript
{
  _id: ObjectId,
  space: ObjectId,
  user: ObjectId,
  role: 'OWNER' | 'EDITOR' | 'COMMENTER' | 'VIEWER',
  permissions: {
    canView: Boolean,
    canEdit: Boolean,
    canDelete: Boolean,
    canManageMembers: Boolean,
    canComment: Boolean,
    canChangeContent: Boolean
  },
  lastAccessedAt: DateTime,
  lastEditedAt: DateTime,
  contributionCount: Number,
  isActive: Boolean,
  invitedAt: DateTime,
  acceptedAt: DateTime,
  invitedBy: ObjectId,
  createdAt: DateTime,
  updatedAt: DateTime
}
```

---

## Error Handling

### Common Error Responses

**400 Bad Request**
```json
{
  "message": "Invalid request body",
  "errors": { "title": "Title is required" }
}
```

**403 Forbidden**
```json
{
  "message": "You do not have permission to edit this space"
}
```

**404 Not Found**
```json
{
  "message": "Space not found"
}
```

**409 Conflict**
```json
{
  "message": "Cannot delete the last owner"
}
```

---

## Real-Time Collaboration Features

### Conflict Resolution
- **Optimistic Locking**: Element locks prevent simultaneous editing
- **Version Tracking**: All changes tracked with version numbers
- **CRDT-Ready**: Structure supports conflict-free data types

### Presence Awareness
- **Active User Count**: See how many people are editing
- **Typing Indicators**: Know when others are typing
- **Cursor Tracking**: See where others are working

### Autosave
- Automatic saves every 30 seconds
- Manual save triggers full version
- Maintains edit history

---

## Usage Examples

### Create and Edit Space
```javascript
// 1. Create space
const createResp = await axios.post('/api/spaces', {
  projectId,
  title: 'Team Meeting Notes',
  defaultContentType: 'TEXT'
});
const spaceId = createResp.data.data._id;

// 2. Connect WebSocket
const socket = io(wsUrl, { auth: { token } });
socket.emit('space:join', { spaceId, userId });

// 3. Listen for updates
socket.on('content:updated', (data) => {
  // Update local content
});

// 4. Send update
socket.emit('content:update', {
  spaceId, userId,
  textContent: 'Updated notes...'
});

// 5. Save explicitly
await axios.patch(`/api/spaces/${spaceId}/content`, {
  textContent: 'Final content',
  editSummary: 'Completed meeting notes',
  isMajorVersion: true
});
```

---

## Security & Best Practices

1. **Always verify user has access** via SpaceMember check
2. **Role-based access control** enforced at middleware level
3. **Autosave prevents data loss** with version tracking
4. **Edit conflicts prevented** with element-level locks
5. **Activity audit trail** logged in SpaceActivity
6. **Real-time permissions** validated on WebSocket events

---

## Performance Considerations

- **Pagination**: Use limit/skip for version history
- **Lazy Loading**: Load comments on demand
- **WebSocket Heartbeat**: 30-second keep-alive to prevent stale connections
- **Autosave Throttling**: 30-second intervals to avoid server overload
- **Connection Pooling**: Supports 20+ concurrent users per space

---

*Last Updated: January 10, 2025*
*Status: Production Ready*
