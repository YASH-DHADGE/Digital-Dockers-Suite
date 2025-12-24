const { google } = require('googleapis');

// OAuth2 client for Google Calendar API
const createOAuth2Client = (callbackUrl = null) => {
    return new google.auth.OAuth2(
        process.env.GOOGLE_CLIENT_ID,
        process.env.GOOGLE_CLIENT_SECRET,
        callbackUrl || process.env.GOOGLE_CALLBACK_URL || 'http://localhost:5000/api/auth/google/callback'
    );
};

/**
 * Create a Google Calendar event with Google Meet
 * @param {Object} accessToken - User's OAuth access token
 * @param {Object} meetingDetails - Meeting details
 * @returns {Object} - Created event with meet link
 */
const createCalendarEventWithMeet = async (accessToken, meetingDetails) => {
    const oauth2Client = createOAuth2Client();
    oauth2Client.setCredentials({ access_token: accessToken });

    const calendar = google.calendar({ version: 'v3', auth: oauth2Client });

    const event = {
        summary: meetingDetails.title,
        description: meetingDetails.description || '',
        start: {
            dateTime: new Date(meetingDetails.scheduledAt).toISOString(),
            timeZone: 'Asia/Kolkata',
        },
        end: {
            dateTime: new Date(new Date(meetingDetails.scheduledAt).getTime() + (meetingDetails.duration || 60) * 60000).toISOString(),
            timeZone: 'Asia/Kolkata',
        },
        attendees: meetingDetails.participants?.map(p => ({ email: p.email })) || [],
        conferenceData: {
            createRequest: {
                requestId: `meet-${Date.now()}`,
                conferenceSolutionKey: { type: 'hangoutsMeet' },
            },
        },
    };

    try {
        const response = await calendar.events.insert({
            calendarId: 'primary',
            resource: event,
            conferenceDataVersion: 1,
            sendUpdates: 'all', // Send email invites to attendees
        });

        return {
            eventId: response.data.id,
            meetLink: response.data.hangoutLink,
            htmlLink: response.data.htmlLink,
        };
    } catch (error) {
        console.error('Error creating calendar event:', error.message);
        throw error;
    }
};

/**
 * Generate Google Meet link URL for OAuth flow
 * @param {string} state - Optional state parameter for security
 */
const getCalendarAuthUrl = (state = '') => {
    // Use default OAuth callback URL (same as general login) to avoid redirect_uri_mismatch
    const oauth2Client = createOAuth2Client();

    const scopes = [
        'https://www.googleapis.com/auth/calendar',
        'https://www.googleapis.com/auth/calendar.events',
    ];

    const authUrlOptions = {
        access_type: 'offline',
        scope: scopes,
        prompt: 'consent',
    };

    if (state) {
        authUrlOptions.state = state;
    }

    return oauth2Client.generateAuthUrl(authUrlOptions);
};

/**
 * Exchange authorization code for tokens
 */
const getTokensFromCode = async (code) => {
    // Use default callback URL (same as getCalendarAuthUrl)
    const oauth2Client = createOAuth2Client();
    const { tokens } = await oauth2Client.getToken(code);
    return tokens;
};

/**
 * List upcoming calendar events
 * @param {string} accessToken - User's OAuth access token
 * @returns {Array} - List of events
 */
const listEvents = async (accessToken) => {
    const oauth2Client = createOAuth2Client();
    oauth2Client.setCredentials({ access_token: accessToken });

    const calendar = google.calendar({ version: 'v3', auth: oauth2Client });

    try {
        const response = await calendar.events.list({
            calendarId: 'primary',
            timeMin: new Date().toISOString(),
            maxResults: 10,
            singleEvents: true,
            orderBy: 'startTime',
        });
        return response.data.items;
    } catch (error) {
        console.error('Error listing calendar events:', error.message);
        throw error;
    }
};

/**
 * Refresh expired access token using refresh token
 * @param {string} refreshToken - User's refresh token
 * @returns {Object} - New access token and expiry
 */
const refreshAccessToken = async (refreshToken) => {
    const oauth2Client = createOAuth2Client();
    oauth2Client.setCredentials({ refresh_token: refreshToken });

    try {
        const { credentials } = await oauth2Client.refreshAccessToken();
        return {
            access_token: credentials.access_token,
            expires_in: credentials.expiry_date ? Math.floor((credentials.expiry_date - Date.now()) / 1000) : 3600
        };
    } catch (error) {
        console.error('Error refreshing access token:', error.message);
        throw error;
    }
};

module.exports = {
    createCalendarEventWithMeet,
    getCalendarAuthUrl,
    getTokensFromCode,
    listEvents,
    refreshAccessToken
};
