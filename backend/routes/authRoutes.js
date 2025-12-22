const express = require('express');
const router = express.Router();
const { registerUser, loginUser, getMe, googleAuthCallback } = require('../controllers/authController');
const { protect } = require('../middlewares/authMiddleware');
const passport = require('passport');

router.post('/register', registerUser);
router.post('/login', loginUser);
router.get('/me', protect, getMe);

// Google OAuth routes
router.get('/google', passport.authenticate('google', {
    scope: [
        'profile',
        'email',
        'https://www.googleapis.com/auth/calendar',
        'https://www.googleapis.com/auth/calendar.events',
        'https://www.googleapis.com/auth/gmail.send'
    ],
    accessType: 'offline', // Crucial: Requests a refresh token
    prompt: 'consent'      // Crucial: Forces consent screen to ensure refresh token is returned
}));
router.get('/google/callback',
    passport.authenticate('google', { session: false, failureRedirect: 'http://localhost:5173/login' }),
    googleAuthCallback
);

module.exports = router;
