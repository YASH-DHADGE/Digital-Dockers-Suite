import { useState, useEffect, useCallback } from 'react';

/**
 * useTimer Hook
 * Manages timer state and elapsed time calculation
 * Handles interval updates and formatting
 */
export const useTimer = (initialTime = null) => {
  const [startTime, setStartTime] = useState(initialTime);
  const [isRunning, setIsRunning] = useState(false);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);

  // Interval effect for updating elapsed time
  useEffect(() => {
    if (!isRunning || !startTime) return;

    const interval = setInterval(() => {
      const now = new Date();
      const elapsed = Math.floor((now - startTime) / 1000);
      setElapsedSeconds(elapsed);
    }, 1000);

    return () => clearInterval(interval);
  }, [isRunning, startTime]);

  // Format elapsed time as HH:MM:SS
  const formatTime = useCallback((seconds) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    
    return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  }, []);

  // Convert to minutes
  const getMinutes = useCallback(() => {
    return Math.floor(elapsedSeconds / 60);
  }, [elapsedSeconds]);

  // Start timer
  const start = useCallback(() => {
    if (!isRunning) {
      setStartTime(new Date());
      setIsRunning(true);
    }
  }, [isRunning]);

  // Stop timer
  const stop = useCallback(() => {
    if (isRunning) {
      setIsRunning(false);
      return {
        startTime,
        endTime: new Date(),
        durationMinutes: getMinutes(),
        durationSeconds: elapsedSeconds
      };
    }
    return null;
  }, [isRunning, startTime, elapsedSeconds, getMinutes]);

  // Reset timer
  const reset = useCallback(() => {
    setStartTime(null);
    setIsRunning(false);
    setElapsedSeconds(0);
  }, []);

  return {
    startTime,
    isRunning,
    elapsedSeconds,
    formattedTime: formatTime(elapsedSeconds),
    start,
    stop,
    reset,
    getMinutes
  };
};

export default useTimer;
