# 🏗️ Spaces Feature - Architecture Diagram

## System Architecture Overview

```
┌─────────────────────────────────────────────────────────────────────┐
│                         USER BROWSER                                │
│                                                                      │
│  ┌────────────────────────────────────────────────────────────────┐ │
│  │  REACT FRONTEND (localhost:5173)                              │ │
│  │                                                               │ │
│  │  ┌─────────────────────────────────────────────────────────┐ │ │
│  │  │ Spaces.jsx (Main Hub)                                  │ │ │
│  │  │ ├─ Create Space Modal                                 │ │ │
│  │  │ ├─ Space List/Grid                                    │ │ │
│  │  │ └─ Navigation Tabs                                    │ │ │
│  │  └─────────────────────────────────────────────────────────┘ │ │
│  │                        │                                       │ │
│  │                        ▼                                       │ │
│  │  ┌─────────────────────────────────────────────────────────┐ │ │
│  │  │ SpaceEditor.jsx (Orchestrator)                         │ │ │
│  │  │ ├─ Autosave Loop (30s)                               │ │ │
│  │  │ ├─ Manual Save Trigger                                │ │ │
│  │  │ ├─ useSpaceWebSocket Hook                            │ │ │
│  │  │ ├─ Tab Navigation                                     │ │ │
│  │  │ └─ Sidebar (Members, Comments)                        │ │ │
│  │  └─────────────────────────────────────────────────────────┘ │ │
│  │          │                      │                  │           │ │
│  │          ▼                      ▼                  ▼           │ │
│  │    ┌──────────────┐    ┌──────────────────┐    ┌──────────┐  │ │
│  │    │ NotesEditor  │    │ WhiteboardEditor │    │MindMap   │  │ │
│  │    ├─ Textarea    │    ├─ Canvas Drawing  │    │Editor    │  │ │
│  │    ├─ Toolbar     │    ├─ Color Picker    │    ├─ SVG     │  │ │
│  │    ├─ Formatting  │    ├─ Brush Sizes     │    │Nodes     │  │ │
│  │    └─ Markdown    │    ├─ Undo/Redo       │    ├─ Add     │  │ │
│  │                   │    └─ History         │    │Child     │  │ │
│  │                   │                       │    └──────────┘  │ │
│  │                   │                       │                  │ │
│  │    ┌──────────────┐    ┌──────────────────────────────────┐ │ │
│  │    │SpaceMembers  │    │ SpaceComments                    │ │ │
│  │    │              │    │                                  │ │ │
│  │    ├─ Add Member  │    ├─ Comment List                   │ │ │
│  │    ├─ Role Editor │    ├─ Threading                      │ │ │
│  │    ├─ Removal     │    ├─ Mentions                       │ │ │
│  │    └─ Contrib.    │    └─ Resolution                     │ │ │
│  │       Count       │                                       │ │ │
│  │                   │                                       │ │ │
│  └────────────────────────────────────────────────────────────┘ │ │
│         │                          │                             │ │
│         │ HTTP + WebSocket         │                             │ │
│         │ (axios + socket.io-client)                            │ │
│         │                          │                             │ │
└─────────┼──────────────────────────┼────────────────────────────┘
          │                          │
          │                          │
┌─────────┼──────────────────────────┼────────────────────────────┐
│         ▼                          ▼                             │
│  ┌─────────────────────────────────────────────────────────────┐ │
│  │ EXPRESS.JS BACKEND (localhost:5000)                        │ │
│  │                                                             │ │
│  │  HTTP Endpoints        WebSocket Events                    │ │
│  │  ┌────────────────┐    ┌──────────────────────┐           │ │
│  │  │ ROUTES         │    │ spaceCollaboration   │           │ │
│  │  │                │    │ Handler              │           │ │
│  │  │ /api/spaces/   │    │                      │           │ │
│  │  │  ├─ POST /     │    │ Events:              │           │ │
│  │  │  ├─ GET /      │    │ ├─ space:join        │           │ │
│  │  │  ├─ PATCH /    │    │ ├─ space:leave       │           │ │
│  │  │  ├─ DELETE /   │    │ ├─ content:update    │           │ │
│  │  │  ├─ /content   │    │ ├─ cursor:move       │           │ │
│  │  │  ├─ /autosave  │    │ ├─ user:typing       │           │ │
│  │  │  ├─ /versions  │    │ ├─ element:select    │           │ │
│  │  │  ├─ /members   │    │ ├─ presence:update   │           │ │
│  │  │  └─ /comments  │    │ ├─ sync:request      │           │ │
│  │  │                │    │ └─ ping              │           │ │
│  │  └────────────────┘    └──────────────────────┘           │ │
│  │         │                        │                         │ │
│  │         ▼                        ▼                         │ │
│  │  ┌────────────────────────────────────────┐              │ │
│  │  │ CONTROLLERS                            │              │ │
│  │  │                                        │              │ │
│  │  │ spaceController                       │              │ │
│  │  │ ├─ createSpace()                      │              │ │
│  │  │ ├─ getProjectSpaces()                 │              │ │
│  │  │ ├─ getSpace()                         │              │ │
│  │  │ ├─ updateSpace()                      │              │ │
│  │  │ ├─ deleteSpace()                      │              │ │
│  │  │ ├─ getVersionHistory()                │              │ │
│  │  │ └─ revertToVersion()                  │              │ │
│  │  │                                        │              │ │
│  │  │ spaceContentController                │              │ │
│  │  │ ├─ updateContent()                    │              │ │
│  │  │ ├─ autosaveContent()                  │              │ │
│  │  │ └─ getContentDiff()                   │              │ │
│  │  │                                        │              │ │
│  │  │ spaceMemberController                 │              │ │
│  │  │ ├─ addMember()                        │              │ │
│  │  │ ├─ updateMemberRole()                 │              │ │
│  │  │ ├─ removeMember()                     │              │ │
│  │  │ └─ getMembers()                       │              │ │
│  │  └────────────────────────────────────────┘              │ │
│  │         │                                                │ │
│  │         ▼                                                │ │
│  │  ┌──────────────────────────────────────────┐           │ │
│  │  │ MIDDLEWARE (Authorization Layer)        │           │ │
│  │  │                                          │           │ │
│  │  │ protect                                  │           │ │
│  │  │ └─ Validates JWT token                 │           │ │
│  │  │                                          │           │ │
│  │  │ spacePermissionCheck                     │           │ │
│  │  │ └─ Verifies membership                 │           │ │
│  │  │                                          │           │ │
│  │  │ checkSpacePermission(flag)               │           │ │
│  │  │ └─ Validates permission flag            │           │ │
│  │  │                                          │           │ │
│  │  │ requireRole(level)                       │           │ │
│  │  │ └─ Role hierarchy check                 │           │ │
│  │  └──────────────────────────────────────────┘           │ │
│  │         │                                                │ │
│  │         ▼                                                │ │
│  │  ┌──────────────────────────────────────────┐           │ │
│  │  │ MODELS (MongoDB Schemas)                 │           │ │
│  │  │                                          │           │ │
│  │  │ ├─ Space                                │           │ │
│  │  │ │  └─ Workspace metadata               │           │ │
│  │  │ │                                       │           │ │
│  │  │ ├─ SpaceContent                        │           │ │
│  │  │ │  └─ Versioned content                │           │ │
│  │  │ │     (TEXT/WHITEBOARD/MINDMAP)       │           │ │
│  │  │ │                                       │           │ │
│  │  │ ├─ SpaceMember                         │           │ │
│  │  │ │  └─ Access control (roles+perms)    │           │ │
│  │  │ │                                       │           │ │
│  │  │ ├─ SpaceActivity                       │           │ │
│  │  │ │  └─ Audit trail (14 types)          │           │ │
│  │  │ │                                       │           │ │
│  │  │ └─ SpaceComment                        │           │ │
│  │  │    └─ Discussions (threaded)           │           │ │
│  │  │                                          │           │ │
│  │  └──────────────────────────────────────────┘           │ │
│  │         │                                                │ │
└──┼─────────┼────────────────────────────────────────────────┘
   │         │
   │ Mongoose ODM
   │         │
   ▼         ▼
┌───────────────────────────────────┐
│ MONGODB DATABASE                  │
│                                   │
│ Collections:                      │
│ ├─ spaces (workspace metadata)    │
│ ├─ spacecontents (versioned)      │
│ ├─ spacemembers (access control)  │
│ ├─ spaceactivities (audit trail)  │
│ └─ spacecomments (discussions)    │
│                                   │
│ Features:                         │
│ ├─ 14 indexes for fast queries    │
│ ├─ TTL on activities (30 days)   │
│ ├─ Unique constraints             │
│ └─ Soft delete support            │
└───────────────────────────────────┘
```

---

## Data Flow Diagram

```
USER ACTION (Frontend)
       │
       ▼
   React State
       │
       ├─► Optimistic UI Update (immediate)
       │   └─► Show in UI before server responds
       │
       ▼
   HTTP Request / WebSocket Event
       │
       ▼
   Backend Processing
       │
       ├─► Validate Input
       ├─► Check Permissions
       ├─► Execute Business Logic
       ├─► Save to Database
       └─► Log Activity
       │
       ▼
   Response / Broadcast
       │
       ├─► HTTP Response (success/error)
       │   └─► Browser updates UI based on response
       │
       ├─► WebSocket Broadcast to Room
       │   └─► All connected clients receive update
       │
       └─► Database Persistence
           └─► Data survives server restart

REAL-TIME SYNC EXAMPLE:
─────────────────────

User A              User B              Server
  │                   │                   │
  │ Type "hello"      │                   │
  ├──► Show locally ──┐                   │
  │                   │                   │
  │                   │ Send content:update
  │                   ├──────────────────►│
  │                   │                   ├─ Save to DB
  │                   │                   ├─ Broadcast to room
  │                   │                   │
  │ Receive broadcast ◄─────────────────────┤
  ├──► Update notes   │                   │
  │    "User B typing"│                   │
  │                   │                   │
  │ 30s passes        │ 30s passes        │
  │                   │                   │
  │ Autosave trigger  │ Autosave trigger  │
  ├──────────────────►│ ├─────────────────►│
  │                   │                   ├─ Save as non-major
  │                   │                   │   version
  │
```

---

## Component Hierarchy

```
Spaces (Main Hub)
  │
  ├─ SpaceList
  │  ├─ SpaceCard (repeated)
  │  │  ├─ Delete Button
  │  │  └─ Members Button
  │  └─ CreateModal
  │     ├─ TitleInput
  │     ├─ DescriptionInput
  │     └─ ContentTypeSelect
  │
  └─ SpaceEditor (when space selected)
     ├─ Editor Header
     │  ├─ SpaceTitle
     │  ├─ SaveButton
     │  └─ LastSaved timestamp
     │
     ├─ EditorTabs
     │  ├─ NotesEditor (content type = TEXT)
     │  │  ├─ Toolbar (Bold, Italic, Lists)
     │  │  ├─ Textarea
     │  │  └─ Stats (chars, lines)
     │  │
     │  ├─ WhiteboardEditor (content type = WHITEBOARD)
     │  │  ├─ Canvas
     │  │  ├─ ColorPicker
     │  │  ├─ BrushSizer
     │  │  ├─ UndoButton
     │  │  ├─ RedoButton
     │  │  └─ ClearButton
     │  │
     │  └─ MindMapEditor (content type = MINDMAP)
     │     ├─ SVGContainer
     │     ├─ NodeList
     │     ├─ AddChildButton
     │     └─ DeleteButton
     │
     └─ Sidebar
        ├─ SpaceMembers Tab
        │  ├─ AddMemberButton
        │  │  └─ AddMemberModal
        │  │     ├─ UserSelect
        │  │     └─ RoleSelect
        │  └─ MemberList
        │     └─ MemberCard (repeated)
        │        ├─ Avatar + Name
        │        ├─ RoleEditor
        │        └─ RemoveButton
        │
        └─ SpaceComments Tab
           ├─ CommentForm
           │  └─ CommentInput
           └─ CommentList
              └─ CommentThread (nested)
                 ├─ Author Info
                 ├─ CommentText
                 ├─ Reactions
                 ├─ ReplyButton
                 └─ DeleteButton
```

---

## State Management Diagram

```
Frontend State (React)
├─ SpaceEditor Level
│  ├─ content: { type, textContent, drawingData, mindmapData, version }
│  ├─ activeTab: "notes" | "whiteboard" | "mindmap"
│  ├─ isSaving: boolean
│  ├─ lastSaved: timestamp
│  ├─ isAutoSaving: boolean
│  │
│  └─ WebSocket State (from useSpaceWebSocket)
│     ├─ isConnected: boolean
│     ├─ activeUsers: [{ userId, name, avatar, color, isTyping }]
│     ├─ cursors: { userId: { x, y } }
│     ├─ typingUsers: [{ userId, name }]
│     └─ socket: Socket instance
│
└─ Component Level (Local)
   ├─ NotesEditor
   │  └─ text: string (auto-synced to parent)
   │
   ├─ WhiteboardEditor
   │  ├─ canvas: HTMLCanvasElement ref
   │  ├─ context: CanvasRenderingContext2D
   │  ├─ isDrawing: boolean
   │  ├─ color: string
   │  ├─ brushSize: number
   │  ├─ history: ImageData[]
   │  └─ historyStep: number
   │
   ├─ MindMapEditor
   │  ├─ nodes: Map<id, { text, x, y, children }>
   │  ├─ selectedNodeId: string | null
   │  └─ rootNodeId: string
   │
   └─ SpaceMembers
      ├─ members: Member[]
      ├─ addModalVisible: boolean
      ├─ selectedUserId: string
      └─ selectedRole: string
```

---

## WebSocket Communication Pattern

```
Client                          Server
  │                               │
  │─► socket.connect() ──────────►│ (authenticate)
  │                               │
  │─► emit('space:join', {
  │    spaceId, userId, userInfo
  │  })──────────────────────────►│ (join room)
  │                               │
  │◄──────────── broadcast
  │           ('user:joined',
  │            activeUsers) ◄─────┤
  │                               │
  │─► emit('content:update', {
  │    spaceId, content, 
  │    timestamp
  │  })──────────────────────────►│ (update received)
  │                               │ (save to DB)
  │                               │
  │◄──────────── broadcast
  │           ('content:updated',
  │            content) ◄─────────┤ (to all in room)
  │                               │
  │─► emit('cursor:move', {
  │    spaceId, x, y
  │  })──────────────────────────►│
  │                               │
  │◄──────────── broadcast
  │           ('cursor:moved',
  │            { userId, x, y })  │
  │◄────────────────────────────────┤
  │                               │
  │─► emit('user:typing', {
  │    spaceId, isTyping
  │  })──────────────────────────►│
  │                               │
  │◄──────────── broadcast
  │           ('user:typing',
  │            { userId, isTyping })
  │◄────────────────────────────────┤
  │                               │
  │─► (disconnect / 30min timeout)│
  │                               │
  │─► emit('space:leave',
  │    spaceId)──────────────────►│ (cleanup)
  │                               │
  │◄──────────── broadcast
  │           ('user:left',
  │            userId) ◄─────────┤ (to room)
  │                               │
```

---

## Database Relationship Diagram

```
┌─────────────────────────────┐
│ Space                       │
├─────────────────────────────┤
│ _id (ObjectId)              │
│ title (String)              │
│ description (String)        │
│ project (ObjectId→Project)  │◄─┐
│ createdBy (ObjectId→User)   │  │ 1-to-Many
│ updatedBy (ObjectId→User)   │  │
│ defaultContentType (String) │  │
│ isArchived (Boolean)        │  │
│ contributorCount (Number)   │  │
│ viewCount (Number)          │  │
│ versionCount (Number)       │  │
│ createdAt, updatedAt        │  │
└─────────────────────────────┘  │
         │                       │
         │ 1-to-Many            │
         ▼                       │
┌─────────────────────────────┐  │
│ SpaceContent                │  │
├─────────────────────────────┤  │
│ _id (ObjectId)              │  │
│ space (ObjectId→Space)      │──┘
│ contentType (String)        │
│ version (Number)            │
│ previousVersion (Ref)       │
│ textContent (String)        │
│ drawingData (String/base64) │
│ mindmapData (Object)        │
│ updatedBy (ObjectId→User)   │
│ editSummary (String)        │
│ isMajorVersion (Boolean)    │
│ isAutoSave (Boolean)        │
│ createdAt, updatedAt        │
└─────────────────────────────┘

┌─────────────────────────────┐
│ SpaceMember                 │
├─────────────────────────────┤
│ _id (ObjectId)              │
│ space (ObjectId→Space)      │
│ user (ObjectId→User)        │
│ role (String: OWNER/EDITOR) │
│ permissions (Object)        │
│ lastAccessedAt (Date)       │
│ lastEditedAt (Date)         │
│ contributionCount (Number)  │
│ invitedBy (ObjectId→User)   │
│ invitedAt (Date)            │
│ acceptedAt (Date)           │
│ createdAt, updatedAt        │
└─────────────────────────────┘

┌─────────────────────────────┐
│ SpaceActivity               │
├─────────────────────────────┤
│ _id (ObjectId)              │
│ space (ObjectId→Space)      │
│ actor (ObjectId→User)       │
│ affectedUser (ObjectId)     │
│ activityType (String)       │
│ changes (Object)            │
│ metadata (Object)           │
│ ipAddress (String)          │
│ userAgent (String)          │
│ createdAt (Date w/ TTL)     │
└─────────────────────────────┘

┌─────────────────────────────┐
│ SpaceComment                │
├─────────────────────────────┤
│ _id (ObjectId)              │
│ space (ObjectId→Space)      │
│ author (ObjectId→User)      │
│ text (String)               │
│ parentComment (ObjectId)    │
│ mentions (Array of IDs)     │
│ reactions (Map)             │
│ isResolved (Boolean)        │
│ resolvedBy (ObjectId→User)  │
│ editHistory (Array)         │
│ isDeleted (Boolean)         │
│ createdAt, updatedAt        │
└─────────────────────────────┘
```

---

## API Endpoint Map

```
┌─ /api/spaces/
│
├─ SPACE MANAGEMENT
│  ├─ POST    /                          (Create)
│  ├─ GET     /project/:projectId        (List by project)
│  ├─ GET     /:spaceId                  (Get details)
│  ├─ PATCH   /:spaceId                  (Update)
│  └─ DELETE  /:spaceId                  (Archive)
│
├─ CONTENT MANAGEMENT
│  ├─ PATCH   /:spaceId/content          (Save major version)
│  ├─ POST    /:spaceId/autosave         (Auto-save)
│  ├─ GET     /:spaceId/versions         (History list)
│  ├─ GET     /:spaceId/content/diff/:v1/:v2 (Diff)
│  └─ POST    /:spaceId/versions/:versionId/revert (Revert)
│
└─ MEMBER MANAGEMENT
   ├─ GET     /:spaceId/members          (List)
   ├─ POST    /:spaceId/members          (Add)
   ├─ PATCH   /:spaceId/members/:memberId (Update role)
   └─ DELETE  /:spaceId/members/:memberId (Remove)
```

---

## Feature Interaction Matrix

```
               Notes  Whiteboard  MindMap  Comments  Members
Create          ✅       ✅         ✅        ✅        ✅
Read            ✅       ✅         ✅        ✅        ✅
Update          ✅       ✅         ✅        ✅        ✅
Delete          ✅       ✅         ✅        ✅        ✅
Version         ✅       ✅         ✅        ✅        ✅
Share           ✅       ✅         ✅        ✅        ✅
Comment         ✅       ✅         ✅        ✅        N/A
Collab          ✅       ✅         ✅        ✅        ✅
Permission      ✅       ✅         ✅        ✅        ✅
Audit           ✅       ✅         ✅        ✅        ✅
```

---

## Deployment Architecture

```
Production Server
├─ Node.js Application
│  ├─ Express.js HTTP Server (port 5000)
│  └─ Socket.IO WebSocket (port 5000, /socket.io)
│
├─ MongoDB Database
│  ├─ spaces collection
│  ├─ spacecontents collection
│  ├─ spacemembers collection
│  ├─ spaceactivities collection
│  └─ spacecomments collection
│
├─ Nginx Reverse Proxy
│  ├─ /api/* → Node.js:5000
│  ├─ /socket.io/* → Node.js:5000 (WebSocket)
│  └─ /* → Frontend Static Files
│
└─ Frontend Static Files
   ├─ index.html
   ├─ JS bundles (React)
   └─ CSS files
```

---

This architecture provides a scalable, real-time collaborative workspace system with complete separation of concerns and enterprise-grade security.
