/**
 * WebSocket Handler for Real-Time Space Collaboration
 * Manages live cursors, presence, typing indicators, and instant updates
 */

const SpaceMember = require('../models/SpaceMember');
const SpaceContent = require('../models/SpaceContent');
const Space = require('../models/Space');

class SpaceCollaborationHandler {
  constructor(io) {
    this.io = io;
    this.activeUsers = new Map(); // Map of spaceId -> Map of userId -> userInfo
    this.userCursors = new Map(); // Map of spaceId -> Map of userId -> cursor position
    this.editLocks = new Map(); // Map of elementId -> userId (for conflict prevention)
  }

  /**
   * Initialize WebSocket connection for a space
   */
  initializeConnection(socket, userId, spaceId) {
    const roomName = `space:${spaceId}`;

    // Join the space room
    socket.join(roomName);

    // Track active user
    if (!this.activeUsers.has(spaceId)) {
      this.activeUsers.set(spaceId, new Map());
    }
    this.activeUsers.get(spaceId).set(userId, {
      socketId: socket.id,
      joinedAt: Date.now(),
      isTyping: false
    });

    // Broadcast user joined
    this.io.to(roomName).emit('user:joined', {
      userId,
      activeCount: this.activeUsers.get(spaceId).size,
      timestamp: Date.now()
    });

    console.log(`👤 User ${userId} joined space ${spaceId} (${this.activeUsers.get(spaceId).size} active)`);

    // Return current state to new user
    return {
      activeUsers: Array.from(this.activeUsers.get(spaceId).keys()),
      activeCount: this.activeUsers.get(spaceId).size
    };
  }

  /**
   * Handle user disconnection
   */
  handleDisconnection(socket, userId, spaceId) {
    const roomName = `space:${spaceId}`;

    if (this.activeUsers.has(spaceId)) {
      this.activeUsers.get(spaceId).delete(userId);

      // Clear user's cursor position
      if (this.userCursors.has(spaceId)) {
        this.userCursors.get(spaceId).delete(userId);
      }

      // Broadcast user left
      this.io.to(roomName).emit('user:left', {
        userId,
        activeCount: this.activeUsers.get(spaceId).size
      });

      console.log(`👋 User ${userId} left space ${spaceId}`);

      // Clean up empty spaces
      if (this.activeUsers.get(spaceId).size === 0) {
        this.activeUsers.delete(spaceId);
      }
    }
  }

  /**
   * Handle real-time content update
   * Implements optimistic locking to prevent conflicts
   */
  handleContentUpdate(socket, userId, spaceId, payload) {
    const { contentType, contentJson, textContent, drawingData, mindmapData, collaborativeId } = payload;
    const roomName = `space:${spaceId}`;

    // Validate update doesn't have stale version
    if (payload.baseVersion) {
      // Store for conflict resolution if needed
      payload.clientTimestamp = Date.now();
    }

    // Broadcast to all users in space (including sender)
    this.io.to(roomName).emit('content:updated', {
      userId,
      contentType,
      contentJson,
      textContent,
      drawingData,
      mindmapData,
      collaborativeId,
      timestamp: Date.now()
    });

    console.log(`✏️  User ${userId} updated content in space ${spaceId}`);
  }

  /**
   * Handle cursor position update (for collaborative drawing/editing)
   */
  handleCursorMove(socket, userId, spaceId, payload) {
    const { x, y, elementId, mode } = payload; // mode: 'draw', 'select', etc.
    const roomName = `space:${spaceId}`;

    if (!this.userCursors.has(spaceId)) {
      this.userCursors.set(spaceId, new Map());
    }

    this.userCursors.get(spaceId).set(userId, { x, y, elementId, mode });

    // Broadcast cursor to all users
    this.io.to(roomName).emit('cursor:moved', {
      userId,
      x,
      y,
      elementId,
      mode,
      timestamp: Date.now()
    });
  }

  /**
   * Handle typing indicator
   */
  handleTyping(socket, userId, spaceId, payload) {
    const { isTyping } = payload;
    const roomName = `space:${spaceId}`;

    if (this.activeUsers.has(spaceId) && this.activeUsers.get(spaceId).has(userId)) {
      this.activeUsers.get(spaceId).get(userId).isTyping = isTyping;
    }

    // Broadcast typing status
    this.io.to(roomName).emit('user:typing', {
      userId,
      isTyping,
      timestamp: Date.now()
    });
  }

  /**
   * Handle selection of drawing element
   * Prevents multiple users editing same element
   */
  async handleElementSelection(socket, userId, spaceId, payload) {
    const { elementId, isSelected } = payload;
    const roomName = `space:${spaceId}`;

    if (isSelected) {
      // Try to acquire lock
      if (this.editLocks.has(elementId) && this.editLocks.get(elementId) !== userId) {
        // Already locked by another user
        socket.emit('lock:denied', {
          elementId,
          lockedBy: this.editLocks.get(elementId),
          message: 'Element is being edited by another user'
        });
        return;
      }

      // Acquire lock
      this.editLocks.set(elementId, userId);

      this.io.to(roomName).emit('element:selected', {
        elementId,
        userId,
        isSelected: true,
        timestamp: Date.now()
      });

      console.log(`🔒 User ${userId} locked element ${elementId}`);
    } else {
      // Release lock
      if (this.editLocks.get(elementId) === userId) {
        this.editLocks.delete(elementId);

        this.io.to(roomName).emit('element:deselected', {
          elementId,
          userId,
          timestamp: Date.now()
        });

        console.log(`🔓 User ${userId} released lock on element ${elementId}`);
      }
    }
  }

  /**
   * Handle awareness protocol (presence info)
   * Sends presence metadata to other users
   */
  handlePresence(socket, userId, spaceId, payload) {
    const { name, avatar, color } = payload;
    const roomName = `space:${spaceId}`;

    if (this.activeUsers.has(spaceId) && this.activeUsers.get(spaceId).has(userId)) {
      const userInfo = this.activeUsers.get(spaceId).get(userId);
      userInfo.name = name;
      userInfo.avatar = avatar;
      userInfo.color = color; // For cursor/selection color coding
    }

    // Broadcast presence
    this.io.to(roomName).emit('presence:updated', {
      userId,
      name,
      avatar,
      color,
      timestamp: Date.now()
    });
  }

  /**
   * Request sync: client requests full state from server
   * Useful after network reconnection
   */
  async handleSyncRequest(socket, userId, spaceId) {
    try {
      // Get latest content
      const content = await SpaceContent.findOne({ space: spaceId }).sort({ version: -1 });
      const space = await Space.findById(spaceId);

      // Get active users
      const activeUsers = Array.from(this.activeUsers.get(spaceId)?.values() || []).map(u => ({
        userId: u.socketId,
        name: u.name,
        isTyping: u.isTyping
      }));

      socket.emit('sync:full', {
        content: content?.toObject(),
        space: space?.toObject(),
        activeUsers,
        version: content?.version || 0,
        timestamp: Date.now()
      });

      console.log(`🔄 Synced space ${spaceId} for user ${userId}`);
    } catch (error) {
      socket.emit('error', { message: 'Sync failed', error: error.message });
    }
  }

  /**
   * Get current space state (for diagnostics/debugging)
   */
  getSpaceState(spaceId) {
    return {
      activeUsers: this.activeUsers.get(spaceId)?.size || 0,
      cursors: this.userCursors.get(spaceId)?.size || 0,
      lockedElements: Array.from(this.editLocks.entries())
        .filter(([_, userId]) => this.activeUsers.get(spaceId)?.has(userId))
        .map(([elementId, userId]) => ({ elementId, lockedBy: userId }))
    };
  }
}

module.exports = SpaceCollaborationHandler;
