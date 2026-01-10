import api from './api';

const teamService = {
    /**
     * Get all teams with aggregated stats
     */
    getTeams: async () => {
        const response = await api.get('/teams');
        return response.data;
    },

    /**
     * Get a single team by ID
     */
    getTeam: async (teamId) => {
        const response = await api.get(`/teams/${teamId}`);
        return response.data;
    },

    /**
     * Get detailed metrics for a specific team
     */
    getTeamMetrics: async (teamId) => {
        const response = await api.get(`/teams/${teamId}/metrics`);
        return response.data;
    },

    /**
     * Get global metrics (all teams combined)
     */
    getGlobalMetrics: async () => {
        const response = await api.get('/teams/metrics/global');
        return response.data;
    },

    /**
     * Get all available users for team assignment
     */
    getAvailableUsers: async () => {
        const response = await api.get('/teams/users/available');
        return response.data;
    },

    /**
     * Create a new team
     */
    createTeam: async (teamData) => {
        const response = await api.post('/teams', teamData);
        return response.data;
    },

    /**
     * Update a team
     */
    updateTeam: async (teamId, teamData) => {
        const response = await api.put(`/teams/${teamId}`, teamData);
        return response.data;
    },

    /**
     * Update team members
     * @param {string} teamId 
     * @param {string[]} members - Array of user IDs
     * @param {string} action - 'set', 'add', or 'remove'
     */
    updateTeamMembers: async (teamId, members, action = 'set') => {
        const response = await api.put(`/teams/${teamId}/members`, { members, action });
        return response.data;
    },

    /**
     * Add members to a team
     */
    addMembers: async (teamId, memberIds) => {
        return teamService.updateTeamMembers(teamId, memberIds, 'add');
    },

    /**
     * Remove members from a team
     */
    removeMembers: async (teamId, memberIds) => {
        return teamService.updateTeamMembers(teamId, memberIds, 'remove');
    },

    /**
     * Delete a team
     */
    deleteTeam: async (teamId) => {
        const response = await api.delete(`/teams/${teamId}`);
        return response.data;
    }
};

export default teamService;
