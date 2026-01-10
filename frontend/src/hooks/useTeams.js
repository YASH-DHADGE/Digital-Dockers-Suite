import { useState, useEffect, useCallback } from 'react';
import teamService from '../services/teamService';

/**
 * Hook to fetch and manage teams list
 * @returns {{ teams: Array, loading: boolean, error: string|null, refetch: Function }}
 */
export const useTeams = () => {
    const [teams, setTeams] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const fetchTeams = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const data = await teamService.getTeams();
            setTeams(data);
        } catch (err) {
            console.error('Failed to fetch teams:', err);
            setError(err.response?.data?.message || 'Failed to fetch teams');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchTeams();
    }, [fetchTeams]);

    return { teams, loading, error, refetch: fetchTeams };
};

/**
 * Hook to fetch metrics for a specific team or global metrics
 * @param {string|null} teamId - Team ID or null for global metrics
 * @returns {{ metrics: Object|null, loading: boolean, error: string|null, refetch: Function }}
 */
export const useTeamMetrics = (teamId) => {
    const [metrics, setMetrics] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const fetchMetrics = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            let data;
            if (teamId) {
                data = await teamService.getTeamMetrics(teamId);
            } else {
                data = await teamService.getGlobalMetrics();
            }
            setMetrics(data);
        } catch (err) {
            console.error('Failed to fetch team metrics:', err);
            setError(err.response?.data?.message || 'Failed to fetch metrics');
        } finally {
            setLoading(false);
        }
    }, [teamId]);

    useEffect(() => {
        fetchMetrics();
    }, [fetchMetrics]);

    return { metrics, loading, error, refetch: fetchMetrics };
};

export default { useTeams, useTeamMetrics };
