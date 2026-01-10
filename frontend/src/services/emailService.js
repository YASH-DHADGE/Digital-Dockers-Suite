import api from './api';

const emailService = {
    // Fetch recent sent emails
    getSentEmails: async (limit = 10) => {
        const response = await api.get(`/emails/sent?limit=${limit}`);
        return response.data;
    },

    // Log a sent email metadata
    logSentEmail: async (data) => {
        const response = await api.post('/emails/sent', data);
        return response.data;
    }
};

export default emailService;
