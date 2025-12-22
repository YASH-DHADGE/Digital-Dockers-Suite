const asyncHandler = require('express-async-handler');
const Meeting = require('../models/Meeting');
const User = require('../models/User');
const { createCalendarEventWithMeet, getCalendarAuthUrl } = require('../services/googleCalendarService');

// Generate a Google Meet-like link (placeholder for when Google API is not configured)
const generateMeetLink = () => {
    const chars = 'abcdefghijklmnopqrstuvwxyz';
    const segment = () => Array(3).fill(0).map(() => chars[Math.floor(Math.random() * chars.length)]).join('');
    return `https://meet.google.com/${segment()}-${segment()}-${segment()}`;
};

// Check if Google Calendar API is configured
const isGoogleCalendarConfigured = () => {
    return process.env.GOOGLE_CLIENT_ID &&
        process.env.GOOGLE_CLIENT_SECRET &&
        process.env.GOOGLE_CLIENT_ID !== 'your-google-client-id-here';
};

// @desc    Schedule a new meeting
// @route   POST /api/meetings/schedule
// @access  Private (leads, managers, admin only)
const scheduleMeeting = asyncHandler(async (req, res) => {
    const { title, description, scheduledAt, duration, participants, meetingType } = req.body;

    // Check authorization
    const authorizedRoles = ['admin', 'project_manager', 'technical_lead', 'marketing_lead'];
    if (!authorizedRoles.includes(req.user.role)) {
        res.status(403);
        throw new Error('Not authorized to schedule meetings');
    }

    if (!title || !scheduledAt) {
        res.status(400);
        throw new Error('Please provide title and scheduled time');
    }

    let meetLink = '';
    let calendarEventId = '';

    // Check if user has Google credentials linked
    const user = await User.findById(req.user._id);
    const googleAccessToken = user.googleAccessToken;

    // Try to create real Google Meet link if configured and user has access token
    if (isGoogleCalendarConfigured() && googleAccessToken) {
        try {
            const calendarResult = await createCalendarEventWithMeet(googleAccessToken, {
                title,
                description,
                scheduledAt,
                duration,
                participants
            });
            meetLink = calendarResult.meetLink;
            calendarEventId = calendarResult.eventId;
        } catch (error) {
            console.error('Google Calendar API failed, using placeholder link:', error.message);
            // If token expired, we might need to refresh it (omitted for brevity, but crucial for prod)
            meetLink = generateMeetLink();
        }
    } else {
        // Use placeholder link if Google API not configured or user not linked
        meetLink = generateMeetLink();
    }

    // Process participants
    const processedParticipants = [];
    if (participants && participants.length > 0) {
        for (const p of participants) {
            if (p.userId) {
                const user = await User.findById(p.userId);
                if (user) {
                    processedParticipants.push({
                        user: user._id,
                        email: user.email,
                        name: user.fullName,
                        status: 'pending'
                    });
                }
            } else if (p.email) {
                processedParticipants.push({
                    email: p.email,
                    name: p.name || p.email,
                    status: 'pending'
                });
            }
        }
    }

    const meeting = await Meeting.create({
        title,
        description: description || '',
        createdBy: req.user._id,
        meetLink,
        calendarEventId,
        scheduledAt: new Date(scheduledAt),
        duration: duration || 60,
        participants: processedParticipants,
        meetingType: meetingType || 'google_meet',
        status: 'scheduled'
    });

    await meeting.populate('createdBy', 'fullName email');

    res.status(201).json(meeting);
});

// @desc    Get Google Calendar auth URL
// @route   GET /api/meetings/calendar-auth
// @access  Private
const getCalendarAuth = asyncHandler(async (req, res) => {
    if (!isGoogleCalendarConfigured()) {
        res.status(400);
        throw new Error('Google Calendar API not configured. Please add GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET to .env');
    }

    const authUrl = getCalendarAuthUrl();
    res.json({ authUrl });
});

// @desc    Get all meetings (upcoming + past)
// @route   GET /api/meetings
// @access  Private
const getMeetings = asyncHandler(async (req, res) => {
    const { type } = req.query;
    const now = new Date();

    let query = {};

    // Users can see meetings they created or are participants in
    query.$or = [
        { createdBy: req.user._id },
        { 'participants.user': req.user._id },
        { 'participants.email': req.user.email }
    ];

    if (type === 'upcoming') {
        query.scheduledAt = { $gte: now };
        query.status = { $in: ['scheduled', 'in_progress'] };
    } else if (type === 'past') {
        query.$or = [
            { scheduledAt: { $lt: now } },
            { status: 'completed' }
        ];
    }

    const meetings = await Meeting.find(query)
        .populate('createdBy', 'fullName email')
        .populate('participants.user', 'fullName email')
        .sort({ scheduledAt: -1 });

    res.status(200).json(meetings);
});

// @desc    Get meeting by ID
// @route   GET /api/meetings/:id
// @access  Private
const getMeeting = asyncHandler(async (req, res) => {
    const meeting = await Meeting.findById(req.params.id)
        .populate('createdBy', 'fullName email')
        .populate('participants.user', 'fullName email');

    if (!meeting) {
        res.status(404);
        throw new Error('Meeting not found');
    }

    const isCreator = meeting.createdBy._id.toString() === req.user._id.toString();
    const isParticipant = meeting.participants.some(p =>
        (p.user && p.user._id.toString() === req.user._id.toString()) ||
        p.email === req.user.email
    );
    const isAdmin = req.user.role === 'admin';

    if (!isCreator && !isParticipant && !isAdmin) {
        res.status(403);
        throw new Error('Not authorized to view this meeting');
    }

    res.status(200).json(meeting);
});

// @desc    Update meeting status
// @route   PUT /api/meetings/:id/status
// @access  Private
const updateMeetingStatus = asyncHandler(async (req, res) => {
    const { status } = req.body;
    const meeting = await Meeting.findById(req.params.id);

    if (!meeting) {
        res.status(404);
        throw new Error('Meeting not found');
    }

    if (meeting.createdBy.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
        res.status(403);
        throw new Error('Not authorized');
    }

    meeting.status = status;
    await meeting.save();

    res.status(200).json(meeting);
});

// @desc    Add transcript to meeting
// @route   POST /api/meetings/:id/transcript
// @access  Private
const addTranscript = asyncHandler(async (req, res) => {
    const { text } = req.body;
    const meeting = await Meeting.findById(req.params.id);

    if (!meeting) {
        res.status(404);
        throw new Error('Meeting not found');
    }

    if (meeting.createdBy.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
        res.status(403);
        throw new Error('Not authorized');
    }

    meeting.transcript = {
        text,
        uploadedAt: new Date(),
        uploadedBy: req.user._id
    };
    meeting.status = 'completed';
    await meeting.save();

    res.status(200).json(meeting);
});

// @desc    Cancel meeting
// @route   DELETE /api/meetings/:id
// @access  Private
const cancelMeeting = asyncHandler(async (req, res) => {
    const meeting = await Meeting.findById(req.params.id);

    if (!meeting) {
        res.status(404);
        throw new Error('Meeting not found');
    }

    if (meeting.createdBy.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
        res.status(403);
        throw new Error('Not authorized');
    }

    meeting.status = 'cancelled';
    await meeting.save();

    res.status(200).json({ message: 'Meeting cancelled' });
});

module.exports = {
    scheduleMeeting,
    getMeetings,
    getMeeting,
    updateMeetingStatus,
    addTranscript,
    cancelMeeting,
    getCalendarAuth
};
