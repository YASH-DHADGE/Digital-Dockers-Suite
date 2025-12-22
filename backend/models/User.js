const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = mongoose.Schema({
    fullName: {
        type: String,
        required: [true, 'Please add a name']
    },
    email: {
        type: String,
        required: [true, 'Please add an email'],
        unique: true
    },
    password: {
        type: String,
        required: [true, 'Please add a password']
    },
    role: {
        type: String,
        enum: ['admin', 'project_manager', 'technical_team', 'marketing_team', 'technical_lead', 'marketing_lead'],
        default: 'technical_team'
    },
    reportsTo: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        default: null
    },
    authProvider: {
        type: String,
        enum: ['local', 'google', 'microsoft'],
        default: 'local'
    },
    googleId: String,
    googleAccessToken: String,
    googleRefreshToken: String,
    microsoftId: String,
    profileInfo: {
        phone: String,
        department: String,
        designation: String,
        employeeId: String,
        avatar: String,
        bio: String,
        skills: [String],
        timezone: String
    },
    preferences: {
        language: { type: String, default: 'en' },
        notifications: { type: Boolean, default: true },
        theme: { type: String, default: 'light' }
    },
    isActive: {
        type: Boolean,
        default: true
    },
    isProfileCompleted: {
        type: Boolean,
        default: false
    },
    lastLogin: Date
}, {
    timestamps: true
});

// Encrypt password using bcrypt
userSchema.pre('save', async function () {
    if (!this.isModified('password')) {
        return;
    }
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
});

// Match user entered password to hashed password in database
userSchema.methods.matchPassword = async function (enteredPassword) {
    return await bcrypt.compare(enteredPassword, this.password);
};

module.exports = mongoose.model('User', userSchema);
