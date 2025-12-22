const { google } = require('googleapis');

// Note: Requires GOOGLE_CLIENT_ID etc in .env
const oauth2Client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID || 'dummy-client-id',
    process.env.GOOGLE_CLIENT_SECRET || 'dummy-secret',
    process.env.GOOGLE_CALLBACK_URL || 'http://localhost:5000/api/calendar/callback'
);

const getAuthUrl = () => {
    const scopes = ['https://www.googleapis.com/auth/calendar'];
    return oauth2Client.generateAuthUrl({
        access_type: 'offline',
        scope: scopes
    });
};

const getTokens = async (code) => {
    const { tokens } = await oauth2Client.getToken(code);
    oauth2Client.setCredentials(tokens);
    return tokens;
};

const listEvents = async (tokens) => {
    oauth2Client.setCredentials(tokens);
    const calendar = google.calendar({ version: 'v3', auth: oauth2Client });
    const res = await calendar.events.list({
        calendarId: 'primary',
        timeMin: (new Date()).toISOString(),
        maxResults: 10,
        singleEvents: true,
        orderBy: 'startTime',
    });
    return res.data.items;
};

module.exports = {
    getAuthUrl,
    getTokens,
    listEvents
};
