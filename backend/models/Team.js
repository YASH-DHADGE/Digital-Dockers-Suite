const mongoose = require('mongoose');

const teamSchema = mongoose.Schema({
    name: {
        type: String,
        required: [true, 'Please add a team name'],
        trim: true
    },
    description: {
        type: String,
        trim: true
    },
    lead: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    members: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }],
    projects: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Project'
    }],
    icon: {
        type: String,
        default: null // URL or emoji/icon identifier
    },
    color: {
        type: String,
        default: '#0052CC' // Default team color for UI
    },
    isActive: {
        type: Boolean,
        default: true
    }
}, {
    timestamps: true
});

// Virtual for member count
teamSchema.virtual('memberCount').get(function () {
    return this.members ? this.members.length : 0;
});

// Virtual for project count
teamSchema.virtual('projectCount').get(function () {
    return this.projects ? this.projects.length : 0;
});

// Ensure virtuals are included in JSON output
teamSchema.set('toJSON', { virtuals: true });
teamSchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('Team', teamSchema);
