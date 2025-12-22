const express = require('express');
const router = express.Router();
const {
    scheduleMeeting,
    getMeetings,
    getMeeting,
    updateMeetingStatus,
    addTranscript,
    cancelMeeting,
    getCalendarAuth
} = require('../controllers/meetingController');
const { protect } = require('../middlewares/authMiddleware');

// Get Google Calendar auth URL
router.get('/calendar-auth', protect, getCalendarAuth);

// Schedule a new meeting
router.post('/schedule', protect, scheduleMeeting);

// Get all meetings (query: type=upcoming|past|all)
router.get('/', protect, getMeetings);

// Get single meeting
router.get('/:id', protect, getMeeting);

// Update meeting status
router.put('/:id/status', protect, updateMeetingStatus);

// Add transcript to meeting
router.post('/:id/transcript', protect, addTranscript);

// Cancel meeting
router.delete('/:id', protect, cancelMeeting);

module.exports = router;
