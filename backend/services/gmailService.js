const { google } = require('googleapis');

const createOAuth2Client = () => {
    return new google.auth.OAuth2(
        process.env.GOOGLE_CLIENT_ID,
        process.env.GOOGLE_CLIENT_SECRET,
        process.env.GOOGLE_CALLBACK_URL || 'http://localhost:5000/api/auth/google/callback'
    );
};

// Send Email via Gmail API
const sendGmail = async (accessToken, { to, subject, body }) => {
    const oauth2Client = createOAuth2Client();
    oauth2Client.setCredentials({ access_token: accessToken });

    const gmail = google.gmail({ version: 'v1', auth: oauth2Client });

    // Construct raw email
    const str = [
        `To: ${to}`,
        `Subject: ${subject}`,
        'MIME-Version: 1.0',
        'Content-Type: text/html; charset=utf-8',
        '',
        body
    ].join('\n');

    const encodedMessage = Buffer.from(str)
        .toString('base64')
        .replace(/\+/g, '-')
        .replace(/\//g, '_')
        .replace(/=+$/, '');

    try {
        const res = await gmail.users.messages.send({
            userId: 'me',
            requestBody: {
                raw: encodedMessage,
            },
        });
        return res.data;
    } catch (error) {
        console.error('Gmail Send Error:', error);
        throw error;
    }
};

// List Inbox Messages
const listGmailMessages = async (accessToken, maxResults = 5) => {
    const oauth2Client = createOAuth2Client();
    oauth2Client.setCredentials({ access_token: accessToken });

    const gmail = google.gmail({ version: 'v1', auth: oauth2Client });

    try {
        const res = await gmail.users.messages.list({
            userId: 'me',
            maxResults,
            q: 'label:INBOX',
        });

        const messages = res.data.messages || [];

        // Fetch details for each message
        const detailedMessages = await Promise.all(messages.map(async (msg) => {
            const detail = await gmail.users.messages.get({
                userId: 'me',
                id: msg.id,
                format: 'metadata',
                metadataHeaders: ['Subject', 'From', 'Date'],
            });

            const headers = detail.data.payload.headers;
            const subject = headers.find(h => h.name === 'Subject')?.value || '(No Subject)';
            const from = headers.find(h => h.name === 'From')?.value || 'Unknown';
            const date = headers.find(h => h.name === 'Date')?.value;

            return {
                id: msg.id,
                threadId: msg.threadId,
                snippet: detail.data.snippet,
                subject,
                from,
                date
            };
        }));

        return detailedMessages;
    } catch (error) {
        console.error('Gmail List Error:', error);
        throw error;
    }
};

module.exports = {
    sendGmail,
    listGmailMessages
};
