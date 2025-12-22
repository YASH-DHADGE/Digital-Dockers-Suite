const mongoose = require('mongoose');

const taskSchema = mongoose.Schema({
    title: {
        type: String,
        required: [true, 'Please add a task title']
    },
    description: String,
    priority: {
        type: String,
        enum: ['low', 'medium', 'high', 'urgent'],
        default: 'medium'
    },
    status: {
        type: String,
        enum: ['todo', 'in_progress', 'review', 'completed', 'blocked'],
        default: 'todo'
    },
    assignedTo: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }],
    assignedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    dueDate: Date,
    estimatedTime: Number, // in hours
    aiSuggestions: {
        timeBreakdown: [{
            phase: String,
            duration: Number,
            description: String
        }],
        dependencies: [String],
        recommendedAssignee: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User'
        },
        complexity: String
    },
    linkedMeeting: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Meeting'
    },
    linkedProject: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Project' // Future proofing
    },
    tags: [String],
    comments: [{
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User'
        },
        text: String,
        timestamp: {
            type: Date,
            default: Date.now
        }
    }],
    attachments: [String],
    calendarEventId: String
}, {
    timestamps: true
});

module.exports = mongoose.model('Task', taskSchema);
