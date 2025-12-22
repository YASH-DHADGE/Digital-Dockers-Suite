const mongoose = require('mongoose');

const calendarSchema = mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        ref: 'User'
    },
    googleCalendarId: String,
    events: [{
        eventId: String,
        title: String,
        description: String,
        startTime: Date,
        endTime: Date,
        attendees: [String],
        location: String,
        meetingLink: String,
        linkedTask: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Task'
        },
        linkedMeeting: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Meeting'
        },
        timezone: String,
        reminders: [{
            method: String, // email, popup
            minutes: Number
        }]
    }],
    syncStatus: {
        type: String,
        enum: ['synced', 'pending', 'error'],
        default: 'pending'
    },
    lastSyncedAt: Date
}, {
    timestamps: true
});

module.exports = mongoose.model('Calendar', calendarSchema);
