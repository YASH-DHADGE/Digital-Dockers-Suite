const mongoose = require('mongoose');

const activityLogSchema = mongoose.Schema({
    actor: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    actionType: {
        type: String,
        enum: ['created', 'updated', 'deleted', 'status_changed', 'assigned', 'commented', 'sprint_started', 'sprint_completed', 'moved', 'subtask_created', 'subtask_moved', 'subtask_detached', 'subtask_status_changed', 'parent_status_auto_updated'],
        required: true
    },
    entityType: {
        type: String,
        enum: ['issue', 'project', 'sprint', 'comment', 'epic', 'task', 'subtask'],
        required: true
    },
    entityId: {
        type: mongoose.Schema.Types.ObjectId,
        required: true
    },
    entityKey: String, // e.g., PROJ-101
    project: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Project'
    },
    message: {
        type: String,
        required: true
    },
    details: {
        field: String,
        oldValue: String,
        newValue: String
    },
    isRead: {
        type: Boolean,
        default: false
    }
}, {
    timestamps: true
});

// Indexes for efficient queries
activityLogSchema.index({ project: 1, createdAt: -1 });
activityLogSchema.index({ actor: 1, createdAt: -1 });
activityLogSchema.index({ entityId: 1, createdAt: -1 });
activityLogSchema.index({ createdAt: -1 });

module.exports = mongoose.model('ActivityLog', activityLogSchema);
