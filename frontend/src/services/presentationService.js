import api from './api';

const presentationService = {
    // Create a new presentation with AI
    createPresentation: async (data) => {
        const response = await api.post('/presentations', data);
        return response.data;
    },

    // Get a single presentation by ID
    getPresentation: async (id) => {
        const response = await api.get(`/presentations/${id}`);
        return response.data;
    },

    // Get all presentations for current user
    getMyPresentations: async (limit = 20) => {
        const response = await api.get(`/presentations?limit=${limit}`);
        return response.data;
    },

    // Delete a presentation
    deletePresentation: async (id) => {
        const response = await api.delete(`/presentations/${id}`);
        return response.data;
    }
};

export default presentationService;
