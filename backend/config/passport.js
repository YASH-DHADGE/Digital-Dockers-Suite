const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const User = require('../models/User');

passport.serializeUser((user, done) => {
    done(null, user.id);
});

passport.deserializeUser(async (id, done) => {
    try {
        const user = await User.findById(id);
        done(null, user);
    } catch (error) {
        done(error, null);
    }
});

// Only configure Google OAuth if credentials are provided
if (process.env.GOOGLE_CLIENT_ID &&
    process.env.GOOGLE_CLIENT_SECRET &&
    process.env.GOOGLE_CLIENT_ID !== 'your-google-client-id-here') {

    passport.use(
        new GoogleStrategy(
            {
                clientID: process.env.GOOGLE_CLIENT_ID,
                clientSecret: process.env.GOOGLE_CLIENT_SECRET,
                callbackURL: process.env.GOOGLE_CALLBACK_URL || 'http://localhost:5000/api/auth/google/callback',
            },
            async (accessToken, refreshToken, profile, done) => {
                try {
                    // Check if user already exists
                    let user = await User.findOne({ email: profile.emails[0].value });

                    if (user) {
                        // User exists, update Google ID and tokens
                        user.googleId = profile.id;
                        user.googleAccessToken = accessToken;
                        if (refreshToken) user.googleRefreshToken = refreshToken;
                        await user.save();
                        return done(null, user);
                    }

                    // Create new user
                    user = await User.create({
                        googleId: profile.id,
                        googleAccessToken: accessToken,
                        googleRefreshToken: refreshToken,
                        fullName: profile.displayName,
                        email: profile.emails[0].value,
                        password: Math.random().toString(36).slice(-8), // Random password for Google users
                        role: 'technical_team', // Default role
                        department: 'Engineering',
                        preferences: {
                            notifications: true,
                            theme: 'light',
                        },
                    });

                    done(null, user);
                } catch (error) {
                    done(error, null);
                }
            }
        )
    );
    console.log('✅ Google OAuth configured');
} else {
    console.log('⚠️  Google OAuth not configured - add GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET to .env');
}

module.exports = passport;
