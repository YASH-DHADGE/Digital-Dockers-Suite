const mongoose = require('mongoose');

const wellnessSchema = mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        ref: 'User'
    },
    checkInType: {
        type: String,
        enum: ['daily', 'weekly', 'stress_alert', 'burnout_check'],
        default: 'daily'
    },
    responses: {
        mood: {
            type: String,
            enum: ['excellent', 'good', 'neutral', 'stressed', 'burnout']
        },
        stressLevel: {
            type: Number,
            min: 1,
            max: 10
        },
        workloadFeeling: {
            type: String,
            enum: ['manageable', 'busy', 'overwhelmed']
        },
        sleepQuality: {
            type: String,
            enum: ['excellent', 'good', 'poor']
        },
        additionalNotes: String
    },
    aiAnalysis: {
        overallScore: Number,
        concerns: [String],
        recommendations: [String],
        suggestedActions: [String],
        alertLevel: {
            type: String,
            enum: ['none', 'watch', 'caution', 'urgent']
        }
    },
    managerNotified: {
        type: Boolean,
        default: false
    },
    followUpScheduled: Date
}, {
    timestamps: true
});

module.exports = mongoose.model('Wellness', wellnessSchema);
