/**
 * WebSocket Integration Setup
 * Call this in server.js to initialize real-time collaboration
 */

const SpaceCollaborationHandler = require('./spaceCollaborationHandler');
const SpaceMember = require('../models/SpaceMember');

let collaborationHandler = null;

/**
 * Initialize WebSocket for Spaces
 * @param {SocketIO} io - Socket.IO instance
 */
function initializeSpaceWebSocket(io) {
  collaborationHandler = new SpaceCollaborationHandler(io);

  io.on('connection', (socket) => {
    console.log(`🔌 WebSocket connected: ${socket.id}`);

    /**
     * Join space collaboration room
     * Payload: { spaceId, userId }
     */
    socket.on('space:join', async (data) => {
      const { spaceId, userId } = data;

      try {
        // Verify user has access
        const member = await SpaceMember.findOne({
          space: spaceId,
          user: userId
        });

        if (!member) {
          socket.emit('error', { message: 'Access denied' });
          return;
        }

        // Initialize connection
        const state = collaborationHandler.initializeConnection(socket, userId, spaceId);
        socket.emit('space:joined', {
          success: true,
          ...state
        });
      } catch (error) {
        socket.emit('error', { message: error.message });
      }
    });

    /**
     * Leave space
     */
    socket.on('space:leave', (data) => {
      const { spaceId, userId } = data;
      collaborationHandler.handleDisconnection(socket, userId, spaceId);
      socket.leave(`space:${spaceId}`);
    });

    /**
     * Content update
     */
    socket.on('content:update', (data) => {
      const { spaceId, userId, ...payload } = data;
      collaborationHandler.handleContentUpdate(socket, userId, spaceId, payload);
    });

    /**
     * Cursor movement
     */
    socket.on('cursor:move', (data) => {
      const { spaceId, userId, ...payload } = data;
      collaborationHandler.handleCursorMove(socket, userId, spaceId, payload);
    });

    /**
     * Typing indicator
     */
    socket.on('user:typing', (data) => {
      const { spaceId, userId, ...payload } = data;
      collaborationHandler.handleTyping(socket, userId, spaceId, payload);
    });

    /**
     * Element selection (for drawing)
     */
    socket.on('element:select', async (data) => {
      const { spaceId, userId, ...payload } = data;
      await collaborationHandler.handleElementSelection(socket, userId, spaceId, payload);
    });

    /**
     * Presence update
     */
    socket.on('presence:update', (data) => {
      const { spaceId, userId, ...payload } = data;
      collaborationHandler.handlePresence(socket, userId, spaceId, payload);
    });

    /**
     * Request full sync
     */
    socket.on('sync:request', async (data) => {
      const { spaceId, userId } = data;
      await collaborationHandler.handleSyncRequest(socket, userId, spaceId);
    });

    /**
     * Heartbeat to keep connection alive
     */
    socket.on('ping', () => {
      socket.emit('pong', { timestamp: Date.now() });
    });

    /**
     * Disconnect handler
     */
    socket.on('disconnect', () => {
      console.log(`❌ WebSocket disconnected: ${socket.id}`);
      // Cleanup happens automatically when user leaves/disconnects
    });

    /**
     * Error handler
     */
    socket.on('error', (error) => {
      console.error(`⚠️ WebSocket error: ${error}`);
    });
  });

  return collaborationHandler;
}

/**
 * Get current collaboration handler
 */
function getCollaborationHandler() {
  return collaborationHandler;
}

module.exports = {
  initializeSpaceWebSocket,
  getCollaborationHandler
};
