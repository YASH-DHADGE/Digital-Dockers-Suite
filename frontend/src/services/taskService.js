import api from './api';

const taskService = {
    getTasks: async (filters = {}) => {
        const query = new URLSearchParams(filters).toString();
        const response = await api.get(`/tasks?${query}`);
        return response.data;
    },

    getTasksByProject: async (projectId) => {
        const response = await api.get(`/tasks?projectId=${projectId}`);
        return response.data;
    },

    getTasksBySprint: async (sprintId) => {
        const response = await api.get(`/tasks?sprintId=${sprintId}`);
        return response.data;
    },

    createTask: async (taskData) => {
        const response = await api.post('/tasks', taskData);
        return response.data;
    },

    updateTask: async (id, taskData) => {
        const response = await api.put(`/tasks/${id}`, taskData);
        return response.data;
    },

    deleteTask: async (id) => {
        const response = await api.delete(`/tasks/${id}`);
        return response.data;
    },

    addComment: async (id, text) => {
        const response = await api.post(`/tasks/${id}/comments`, { text });
        return response.data;
    }
};

export default taskService;
