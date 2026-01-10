const Notification = require('../models/Notification');

/**
 * Notification Controller
 * Handles HTTP endpoints for notification management
 */

// @desc Get notifications for authenticated user
// @route GET /api/notifications
// @access Private
exports.getNotifications = async (req, res) => {
    try {
        const { page = 1, limit = 10, unreadOnly = false } = req.query;
        const userId = req.user.id;

        const query = {
            recipient: userId,
            isArchived: false
        };

        if (unreadOnly === 'true') {
            query.isRead = false;
        }

        const skip = (page - 1) * limit;
        const [notifications, total] = await Promise.all([
            Notification.find(query)
                .populate('sender', 'name avatar email')
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(parseInt(limit))
                .lean(),
            Notification.countDocuments(query)
        ]);

        res.json({
            success: true,
            data: {
                notifications,
                pagination: {
                    page: parseInt(page),
                    limit: parseInt(limit),
                    total,
                    pages: Math.ceil(total / parseInt(limit))
                }
            }
        });
    } catch (error) {
        console.error('[NotificationController] Error fetching notifications:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching notifications',
            error: error.message
        });
    }
};

// @desc Get notification feed (recent notifications)
// @route GET /api/notifications/feed
// @access Private
exports.getNotificationFeed = async (req, res) => {
    try {
        const { limit = 5 } = req.query;
        const userId = req.user.id;

        const [notifications, unreadCount] = await Promise.all([
            Notification.getRecentNotifications(userId, parseInt(limit)),
            Notification.getUnreadCount(userId)
        ]);

        res.json({
            success: true,
            data: {
                notifications,
                unreadCount
            }
        });
    } catch (error) {
        console.error('[NotificationController] Error fetching feed:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching notification feed',
            error: error.message
        });
    }
};

// @desc Get unread notification count
// @route GET /api/notifications/unread/count
// @access Private
exports.getUnreadCount = async (req, res) => {
    try {
        const userId = req.user.id;
        const unreadCount = await Notification.getUnreadCount(userId);

        res.json({
            success: true,
            data: {
                unreadCount
            }
        });
    } catch (error) {
        console.error('[NotificationController] Error getting unread count:', error);
        res.status(500).json({
            success: false,
            message: 'Error getting unread count',
            error: error.message
        });
    }
};

// @desc Mark notification as read
// @route PUT /api/notifications/:id/read
// @access Private
exports.markAsRead = async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user.id;

        const notification = await Notification.findById(id);
        
        if (!notification) {
            return res.status(404).json({
                success: false,
                message: 'Notification not found'
            });
        }

        if (notification.recipient.toString() !== userId) {
            return res.status(403).json({
                success: false,
                message: 'Not authorized to update this notification'
            });
        }

        await notification.markAsRead();

        res.json({
            success: true,
            data: { notification }
        });
    } catch (error) {
        console.error('[NotificationController] Error marking as read:', error);
        res.status(500).json({
            success: false,
            message: 'Error marking notification as read',
            error: error.message
        });
    }
};

// @desc Mark all notifications as read
// @route PUT /api/notifications/read/all
// @access Private
exports.markAllAsRead = async (req, res) => {
    try {
        const userId = req.user.id;

        const result = await Notification.updateMany(
            { recipient: userId, isRead: false, isArchived: false },
            { isRead: true }
        );

        res.json({
            success: true,
            data: {
                modifiedCount: result.modifiedCount
            }
        });
    } catch (error) {
        console.error('[NotificationController] Error marking all as read:', error);
        res.status(500).json({
            success: false,
            message: 'Error marking all notifications as read',
            error: error.message
        });
    }
};

// @desc Archive notification
// @route PUT /api/notifications/:id/archive
// @access Private
exports.archiveNotification = async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user.id;

        const notification = await Notification.findById(id);
        
        if (!notification) {
            return res.status(404).json({
                success: false,
                message: 'Notification not found'
            });
        }

        if (notification.recipient.toString() !== userId) {
            return res.status(403).json({
                success: false,
                message: 'Not authorized to archive this notification'
            });
        }

        await notification.archive();

        res.json({
            success: true,
            data: { notification }
        });
    } catch (error) {
        console.error('[NotificationController] Error archiving notification:', error);
        res.status(500).json({
            success: false,
            message: 'Error archiving notification',
            error: error.message
        });
    }
};

// @desc Archive multiple notifications
// @route PUT /api/notifications/archive/bulk
// @access Private
exports.archiveMultiple = async (req, res) => {
    try {
        const { notificationIds } = req.body;
        const userId = req.user.id;

        if (!Array.isArray(notificationIds) || notificationIds.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'Invalid notification IDs'
            });
        }

        const result = await Notification.updateMany(
            {
                _id: { $in: notificationIds },
                recipient: userId
            },
            { isArchived: true }
        );

        res.json({
            success: true,
            data: {
                archivedCount: result.modifiedCount
            }
        });
    } catch (error) {
        console.error('[NotificationController] Error archiving multiple:', error);
        res.status(500).json({
            success: false,
            message: 'Error archiving notifications',
            error: error.message
        });
    }
};

// @desc Delete notification
// @route DELETE /api/notifications/:id
// @access Private
exports.deleteNotification = async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user.id;

        const notification = await Notification.findById(id);
        
        if (!notification) {
            return res.status(404).json({
                success: false,
                message: 'Notification not found'
            });
        }

        if (notification.recipient.toString() !== userId) {
            return res.status(403).json({
                success: false,
                message: 'Not authorized to delete this notification'
            });
        }

        await Notification.findByIdAndDelete(id);

        res.json({
            success: true,
            message: 'Notification deleted successfully'
        });
    } catch (error) {
        console.error('[NotificationController] Error deleting notification:', error);
        res.status(500).json({
            success: false,
            message: 'Error deleting notification',
            error: error.message
        });
    }
};

// @desc Get notification statistics
// @route GET /api/notifications/stats
// @access Private
exports.getStats = async (req, res) => {
    try {
        const userId = req.user.id;

        const [unreadCount, totalCount, byType] = await Promise.all([
            Notification.getUnreadCount(userId),
            Notification.countDocuments({
                recipient: userId,
                isArchived: false
            }),
            Notification.aggregate([
                {
                    $match: {
                        recipient: require('mongoose').Types.ObjectId(userId),
                        isArchived: false
                    }
                },
                {
                    $group: {
                        _id: '$type',
                        count: { $sum: 1 }
                    }
                }
            ])
        ]);

        res.json({
            success: true,
            data: {
                unreadCount,
                totalCount,
                byType: Object.fromEntries(byType.map(t => [t._id, t.count]))
            }
        });
    } catch (error) {
        console.error('[NotificationController] Error getting stats:', error);
        res.status(500).json({
            success: false,
            message: 'Error getting notification statistics',
            error: error.message
        });
    }
};

module.exports = exports;
