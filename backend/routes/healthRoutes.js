const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const { getQueueType, isRedisAvailable } = require('../config/queue.config');

/**
 * Health Check Endpoint
 * 
 * Returns system health status including:
 * - MongoDB connection
 * - Queue system type and status
 * - Redis availability (if applicable)
 * - Timestamp
 * 
 * @route GET /api/health
 * @returns {200} System healthy
 * @returns {503} System degraded or unhealthy
 */
router.get('/', async (req, res) => {
    const health = {
        status: 'healthy',
        timestamp: new Date().toISOString(),
        services: {}
    };

    // Check MongoDB
    try {
        const mongoState = mongoose.connection.readyState;
        const mongoStatus = {
            0: 'disconnected',
            1: 'connected',
            2: 'connecting',
            3: 'disconnecting'
        };

        health.services.mongodb = {
            status: mongoState === 1 ? 'healthy' : 'unhealthy',
            state: mongoStatus[mongoState] || 'unknown',
            connected: mongoState === 1
        };

        if (mongoState !== 1) {
            health.status = 'degraded';
        }
    } catch (error) {
        health.services.mongodb = {
            status: 'unhealthy',
            error: error.message
        };
        health.status = 'unhealthy';
    }

    // Check Queue System
    try {
        const queueType = getQueueType();
        const redisAvailable = isRedisAvailable();

        health.services.queue = {
            status: 'healthy',
            type: queueType,
            redis: queueType === 'redis' ? redisAvailable : 'not-required',
            mode: queueType === 'mock' ? 'development' : 'production'
        };

        // Warn if using mock in production
        if (queueType === 'mock' && process.env.NODE_ENV === 'production') {
            health.services.queue.warning = 'Mock queue in production - not recommended';
            health.status = 'degraded';
        }
    } catch (error) {
        health.services.queue = {
            status: 'unhealthy',
            error: error.message
        };
        health.status = 'unhealthy';
    }

    // Set HTTP status code
    const statusCode = health.status === 'healthy' ? 200 : 503;

    res.status(statusCode).json(health);
});

/**
 * Detailed Health Check (includes queue statistics)
 * 
 * @route GET /api/health/detailed
 * @access Private (add auth middleware if needed)
 */
router.get('/detailed', async (req, res) => {
    // This could include queue job counts, memory usage, etc.
    // For now, return basic health
    const basicHealth = await router.stack[0].route.stack[0].handle(req, res);

    res.json({
        ...basicHealth,
        system: {
            uptime: process.uptime(),
            memory: process.memoryUsage(),
            nodeVersion: process.version,
            platform: process.platform
        }
    });
});

module.exports = router;
