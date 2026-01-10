# Spaces Feature - Integration & Deployment Guide

## Overview

The Spaces feature is now production-ready. This guide walks you through integrating it into your running application, testing it end-to-end, and deploying to production.

**Status**: ✅ All code complete (1200+ lines backend, 1800+ lines frontend)
**Effort**: ~15 minutes to fully integrate
**Risk**: Low - isolated feature, no breaking changes to existing code

---

## Phase 1: Backend Integration (5 minutes)

### Step 1.1: Copy Database Models

Copy these 5 files to `/backend/models/`:
- `Space.js`
- `SpaceContent.js`
- `SpaceMember.js`
- `SpaceActivity.js`
- `SpaceComment.js`

**Verification**: Check that all files have `.js` extension and contain MongoDB Mongoose schemas.

### Step 1.2: Copy Backend Controllers

Copy these 3 files to `/backend/controllers/`:
- `spaceController.js`
- `spaceContentController.js`
- `spaceMemberController.js`

**Verification**: Verify each controller imports `asyncHandler` from `../utils` or equivalent error handling utility.

### Step 1.3: Copy Services & WebSocket Handlers

Create `/backend/services/` if it doesn't exist, then copy:
- `spaceCollaborationHandler.js`
- `spaceWebSocketSetup.js`

**Verification**: Check that `spaceWebSocketSetup.js` exports `initializeSpaceWebSocket` function.

### Step 1.4: Copy Routes

Copy to `/backend/routes/`:
- `spaceRoutes.js`

**Verification**: Verify the file starts with route definitions: `router.post('/', ...)`, etc.

### Step 1.5: Copy Middleware

Copy to `/backend/middlewares/`:
- `spaceMiddleware.js`

**Verification**: Check it exports `spacePermissionCheck`, `checkSpacePermission`, and `requireRole`.

### Step 1.6: Update `server.js` - Mount Routes

Open `/backend/server.js` and add these lines after other route mounts (typically around where other API routes are mounted):

```javascript
// Import Space routes
const spaceRoutes = require('./routes/spaceRoutes');

// ... existing routes ...

// Mount Space routes
app.use('/api/spaces', spaceRoutes);
```

**Location**: Add this after other API route mounts (look for patterns like `app.use('/api/projects'`, `app.use('/api/tasks'`, etc.)

### Step 1.7: Update `server.js` - Initialize WebSocket

Locate where you initialize Socket.IO in your `server.js`. It should look like:

```javascript
const io = require('socket.io')(server, {
  cors: { origin: process.env.CLIENT_URL || 'http://localhost:5173' }
});
```

**After** the io initialization, add:

```javascript
// Initialize Space collaboration handler
const { initializeSpaceWebSocket } = require('./services/spaceWebSocketSetup');
initializeSpaceWebSocket(io);
```

**Verification**: Save and check that `server.js` has no syntax errors.

### Step 1.8: Verify Dependencies

Run these commands in `/backend` directory:

```bash
npm list mongoose socket.io express
```

**Expected output**: All packages should be installed (versions may vary)

If any are missing:
```bash
npm install mongoose socket.io
```

---

## Phase 2: Frontend Integration (5 minutes)

### Step 2.1: Copy React Components

Create `/frontend/src/components/spaces/` directory if it doesn't exist, then copy:
- `Spaces.jsx`
- `SpaceEditor.jsx`
- `NotesEditor.jsx`
- `WhiteboardEditor.jsx`
- `MindMapEditor.jsx`
- `SpaceMembers.jsx`
- `SpaceComments.jsx`

**Verification**: All files should be `.jsx` and contain React component exports.

### Step 2.2: Copy Custom Hook

Copy to `/frontend/src/hooks/`:
- `useSpaceWebSocket.js`

**Verification**: File should export a named function `useSpaceWebSocket` (not default export).

### Step 2.3: Copy Styles

Copy all CSS files to `/frontend/src/components/spaces/`:
- `Spaces.css`
- `SpaceEditor.css`
- `NotesEditor.css`
- `WhiteboardEditor.css`
- `MindMapEditor.css`

**Verification**: CSS files should have `.css` extension.

### Step 2.4: Add Navigation

Open the file where your project dashboard/sidebar navigation is defined (typically `/frontend/src/components/ProjectDashboard.jsx` or similar).

Add this import at the top:

```javascript
import Spaces from './spaces/Spaces';
```

Find the main navigation area (where tabs or menu items are defined) and add:

```javascript
<Button 
  onClick={() => setActiveView('spaces')}
  type={activeView === 'spaces' ? 'primary' : 'default'}
>
  📝 Spaces
</Button>
```

Then add to your view switch/router:

```javascript
{activeView === 'spaces' && <Spaces projectId={projectId} currentUser={currentUser} />}
```

**Example Integration**:
```javascript
// In your main component render/return
<div className="project-dashboard">
  <div className="nav-tabs">
    {/* Existing tabs... */}
    <Button 
      onClick={() => setActiveView('spaces')}
      type={activeView === 'spaces' ? 'primary' : 'default'}
    >
      📝 Spaces
    </Button>
  </div>
  
  <div className="content">
    {activeView === 'spaces' && <Spaces projectId={projectId} currentUser={currentUser} />}
    {/* Other views... */}
  </div>
</div>
```

### Step 2.5: Verify Dependencies

In `/frontend` directory, verify Socket.IO client is installed:

```bash
npm list socket.io-client axios
```

If missing:
```bash
npm install socket.io-client
```

---

## Phase 3: Testing (5 minutes)

### Step 3.1: Start Backend Server

```bash
cd backend
npm start
# or: node server.js
```

**Expected output**:
```
🚀 Server running on http://localhost:5000
✅ Socket.IO ready
✅ Database connected
```

### Step 3.2: Start Frontend Server

In a new terminal:
```bash
cd frontend
npm run dev
# or: npm start
```

**Expected output**:
```
VITE v4.x.x ready in xxx ms
Local: http://localhost:5173
```

### Step 3.3: Test Space Creation

1. Navigate to your project dashboard
2. Click the "📝 Spaces" tab
3. Click "Create New Space"
4. Fill in:
   - **Title**: "Test Notes Space"
   - **Description**: "Testing the feature"
   - **Default Content Type**: "TEXT"
5. Click "Create"

**Expected result**: Space appears in list, no errors in console

### Step 3.4: Test Note Editing

1. Click on the created space
2. You should see the Notes editor
3. Type some text: "Hello Spaces! 🚀"
4. Click "Save"

**Expected result**: Text saved, "Last saved" timestamp updates

### Step 3.5: Test Real-Time Sync (Two Browsers)

1. **Browser 1**: Open the space you created
2. **Browser 2**: Open same project in a new window, navigate to same space
3. **Browser 1**: Edit the text and save
4. **Browser 2**: You should see the update appear within 30 seconds (autosave) or immediately if you click Save

**Expected result**: Content syncs between both tabs/browsers

### Step 3.6: Test Whiteboard Editor

1. Create a new space with "WHITEBOARD" content type
2. Click to enter the space
3. Select the Whiteboard tab
4. Draw something on the canvas
5. Click "Save"

**Expected result**: Drawing saved, no console errors

### Step 3.7: Test Member Management

1. In the space, click "Members" tab
2. Click "Add Member"
3. Select a user from the dropdown
4. Select role "EDITOR"
5. Click "Add"

**Expected result**: Member added, role shows correctly, can be changed/removed

### Step 3.8: Verify WebSocket Connection

Open browser DevTools (F12) → Console:

```javascript
// You should see messages like:
// ✅ Space collaboration connected
// ✅ Joined room: space:xxxxx
```

**Expected**: No red errors related to Socket.IO or spaces

### Step 3.9: Check Backend Logs

In your backend terminal, you should see logs like:

```
[SPACE] Created: 65f7a2b1c9d8e1f2g3h4i5j6k
[SPACE] Content updated for space 65f7a2b1c9d8e1f2g3h4i5j6k
[WEBSOCKET] User connected to room space:65f7a2b1c9d8e1f2g3h4i5j6k
```

---

## Phase 4: Troubleshooting

### Issue: "Cannot find module 'spaceRoutes'"

**Solution**: Verify the file path in `server.js`:
```javascript
const spaceRoutes = require('./routes/spaceRoutes');
// Make sure spaceRoutes.js exists in /backend/routes/
```

### Issue: WebSocket not connecting

**Symptoms**: DevTools shows "Failed to connect to WebSocket"

**Solution**:
1. Verify Socket.IO is initialized: Check `server.js` has `const io = require('socket.io')(server, ...)`
2. Verify `initializeSpaceWebSocket(io)` is called after io creation
3. Check CORS settings match your frontend URL:
   ```javascript
   const io = require('socket.io')(server, {
     cors: { 
       origin: process.env.CLIENT_URL || 'http://localhost:5173'
     }
   });
   ```

### Issue: "Space not found" error

**Symptoms**: All API calls return 404

**Solution**:
1. Verify Space model created correctly: Check `/backend/models/Space.js` has `module.exports = mongoose.model('Space', spaceSchema)`
2. Check database connection: Verify MongoDB is running
3. Try creating a space from browser - should appear in logs

### Issue: Styling looks broken

**Symptoms**: Components display but CSS looks wrong

**Solution**:
1. Clear browser cache: Ctrl+Shift+Delete in Chrome
2. Verify CSS files copied to `/frontend/src/components/spaces/`
3. Verify imports in component files: `import './Spaces.css';`

### Issue: Autosave not working

**Symptoms**: "Last saved" never updates

**Solution**:
1. Check browser console for errors
2. Open DevTools → Network tab, create a space, watch for POST requests to `/api/spaces/.../autosave`
3. Verify backend logs show `[SPACE] Content autosaved`
4. Try manual save first (click "Save" button) to verify basic flow works

### Issue: Can't add members

**Symptoms**: Member dropdown empty or error when adding

**Solution**:
1. Verify User model exists: Check `/backend/models/User.js`
2. Verify space permissions: Only OWNER can add members
3. Check that target user exists in database

---

## Phase 5: Production Deployment

### Pre-Deployment Checklist

- [ ] All files copied to correct directories
- [ ] `server.js` updated with routes and WebSocket init
- [ ] No syntax errors in backend (`npm start` works)
- [ ] No syntax errors in frontend (`npm run dev` works)
- [ ] Created at least one space successfully
- [ ] Real-time sync works between two browsers
- [ ] Autosave works (check logs every 30s)
- [ ] Member management works
- [ ] No JavaScript errors in browser console

### Environment Variables to Verify

In your `.env` file:

```
DATABASE_URL=mongodb://... # Existing
CLIENT_URL=https://yourdomain.com # Update if needed
PORT=5000 # Existing
```

Verify Socket.IO CORS in `server.js` matches your production domain:

```javascript
const io = require('socket.io')(server, {
  cors: { 
    origin: process.env.CLIENT_URL || 'http://localhost:5173'
  }
});
```

### Database Index Creation

For production, ensure MongoDB indexes are created. In MongoDB shell:

```javascript
use your_database_name

// Space indexes
db.spaces.createIndex({ "project": 1, "createdAt": -1 })
db.spaces.createIndex({ "createdBy": 1 })
db.spaces.createIndex({ "project": 1, "isArchived": 1 })

// SpaceContent indexes
db.spacecontents.createIndex({ "space": 1, "contentType": 1, "version": -1 })
db.spacecontents.createIndex({ "space": 1, "updatedAt": -1 })
db.spacecontents.createIndex({ "updatedBy": 1 })

// SpaceMember indexes
db.spacemembers.createIndex({ "space": 1, "user": 1 }, { unique: true })
db.spacemembers.createIndex({ "user": 1, "space": 1 })
db.spacemembers.createIndex({ "space": 1, "role": 1 })

// SpaceActivity indexes
db.spaceactivities.createIndex({ "space": 1, "createdAt": -1 })
db.spaceactivities.createIndex({ "actor": 1 })

// SpaceComment indexes (for future use)
db.spacecomments.createIndex({ "space": 1, "createdAt": -1 })
db.spacecomments.createIndex({ "author": 1 })
```

### Deploy to Production

1. **Backend**: Push code to production server, run `npm install` and restart service
2. **Frontend**: Build with `npm run build`, deploy to CDN/static host
3. **Database**: Run index creation commands above
4. **Verify**: Test in production environment with same checklist as Phase 3

---

## API Reference Quick Links

See `SPACES_API_DOCUMENTATION.md` for:
- All 14 REST endpoints with examples
- WebSocket events and real-time operations
- Data model specifications
- Error handling patterns
- Security best practices
- Performance tuning

---

## Support & Next Steps

### Common Next Enhancements

1. **Search**: Add full-text search across space content
2. **Templates**: Create space templates for quick setup
3. **Notifications**: @mention someone to send notification
4. **Comments**: Implement comment replies (skeleton ready)
5. **Reactions**: Add emoji reactions on comments
6. **Export**: Download space content as PDF/Markdown
7. **Version History UI**: Visual timeline of edits

### Architecture for Future Features

All components are designed to be extended:
- **Add new content type**: Add field to SpaceContent model, create new editor component, update switch statement
- **Add permissions**: Add flag to SpaceMember.permissions object, use in middleware
- **Add notifications**: SpaceActivity structure ready for webhook integration
- **Add search**: SpaceContent has text fields; add MongoDB text indexes

---

## Monitoring & Maintenance

### Health Checks

In production, monitor these endpoints:

```bash
# Backend health
curl http://localhost:5000/health

# Space creation (authenticated)
curl -H "Authorization: Bearer TOKEN" \
  http://localhost:5000/api/spaces/health

# WebSocket connection
# Check browser console for "Space collaboration connected"
```

### Performance Monitoring

Key metrics to track:

- **Autosave latency**: Should be <500ms (check Network tab in DevTools)
- **WebSocket message delivery**: Should be <100ms (check browser console timestamps)
- **Database query time**: Monitor MongoDB slow queries for space queries
- **Memory usage**: In-memory locks in `spaceCollaborationHandler` should stay < 1MB even with 100 concurrent users

### Backup Considerations

- **SpaceContent**: Version history preserved; old versions safe to archive
- **SpaceActivity**: Auto-expires after 30 days; consider exporting for compliance
- **SpaceComment**: No auto-expire; ensure backup includes these

---

**Congratulations!** Spaces feature is now live. Start collaborating! 🚀
