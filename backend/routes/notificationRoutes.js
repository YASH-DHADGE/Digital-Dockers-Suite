const express = require('express');
const router = express.Router();
const notificationController = require('../controllers/notificationController');
const { protect } = require('../middlewares/authMiddleware');

/**
 * Notification Routes
 * All routes require authentication
 */

// Middleware: Protect all routes
router.use(protect);

// @route GET /api/notifications
// @desc Get notifications for authenticated user with pagination
router.get('/', notificationController.getNotifications);

// @route GET /api/notifications/feed
// @desc Get recent notification feed
router.get('/feed', notificationController.getNotificationFeed);

// @route GET /api/notifications/unread/count
// @desc Get count of unread notifications
router.get('/unread/count', notificationController.getUnreadCount);

// @route GET /api/notifications/stats
// @desc Get notification statistics
router.get('/stats', notificationController.getStats);

// @route PUT /api/notifications/:id/read
// @desc Mark a notification as read
router.put('/:id/read', notificationController.markAsRead);

// @route PUT /api/notifications/read/all
// @desc Mark all notifications as read
router.put('/read/all', notificationController.markAllAsRead);

// @route PUT /api/notifications/:id/archive
// @desc Archive a notification
router.put('/:id/archive', notificationController.archiveNotification);

// @route PUT /api/notifications/archive/bulk
// @desc Archive multiple notifications
router.put('/archive/bulk', notificationController.archiveMultiple);

// @route DELETE /api/notifications/:id
// @desc Delete a notification
router.delete('/:id', notificationController.deleteNotification);

module.exports = router;
