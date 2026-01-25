import { useState, useEffect } from 'react';
import api from '../services/api';

export const useGatekeeperFeed = () => {
  const [feed, setFeed] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchGatekeeperFeed = async () => {
      try {
        setLoading(true);
        const response = await api.get('/tech-debt/gatekeeper-feed');
        setFeed(response.data || []);
        setError(null);
      } catch (err) {
        console.error('Failed to fetch gatekeeper feed:', err);
        setError(err.message);
        setFeed([]);
      } finally {
        setLoading(false);
      }
    };

    fetchGatekeeperFeed();
    
    // Set up polling for real-time updates
    const interval = setInterval(fetchGatekeeperFeed, 30000); // Poll every 30 seconds
    
    return () => clearInterval(interval);
  }, []);

  return { feed, loading, error };
};