const { google } = require('googleapis');

// OAuth2 client for Google Calendar API
const createOAuth2Client = () => {
    return new google.auth.OAuth2(
        process.env.GOOGLE_CLIENT_ID,
        process.env.GOOGLE_CLIENT_SECRET,
        process.env.GOOGLE_CALLBACK_URL || 'http://localhost:5000/api/auth/google/callback'
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
 */
const getCalendarAuthUrl = () => {
    const oauth2Client = createOAuth2Client();

    const scopes = [
        'https://www.googleapis.com/auth/calendar',
        'https://www.googleapis.com/auth/calendar.events',
    ];

    return oauth2Client.generateAuthUrl({
        access_type: 'offline',
        scope: scopes,
        prompt: 'consent',
    });
};

/**
 * Exchange authorization code for tokens
 */
const getTokensFromCode = async (code) => {
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

module.exports = {
    createCalendarEventWithMeet,
    getCalendarAuthUrl,
    getTokensFromCode,
    listEvents
};
