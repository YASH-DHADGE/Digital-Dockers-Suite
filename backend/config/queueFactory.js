/**
 * Queue Factory
 * 
 * Provides unified queue creation with automatic fallback from Bull (Redis)
 * to MockQueue for development environments.
 * 
 * Usage:
 *   const { createQueue } = require('./queueFactory');
 *   const analysisQueue = createQueue('analysis');
 *   
 * Environment:
 *   - REDIS_URL: If set, uses Bull with Redis backend (production)
 *   - Otherwise: Uses MockQueue for in-memory processing (development)
 */

const MockQueue = require('../utils/mockQueue');

// Track created queues for graceful shutdown
const activeQueues = new Map();

/**
 * Create a queue with automatic backend selection
 * @param {string} name - Queue name
 * @param {object} options - Queue configuration options
 * @returns {Bull|MockQueue} Queue instance
 */
function createQueue(name, options = {}) {
    // Check if queue already exists
    if (activeQueues.has(name)) {
        console.log(`♻️  [QueueFactory] Reusing existing queue: "${name}"`);
        return activeQueues.get(name);
    }

    const redisUrl = process.env.REDIS_URL;
    const isDevelopment = process.env.NODE_ENV !== 'production';

    let queue;

    if (redisUrl && !isDevelopment) {
        // Production mode with Redis
        try {
            const Bull = require('bull');

            const defaultOptions = {
                redis: redisUrl,
                defaultJobOptions: {
                    attempts: 3,
                    backoff: {
                        type: 'exponential',
                        delay: 1000
                    },
                    removeOnComplete: 1000,
                    removeOnFail: 5000
                },
                ...options
            };

            queue = new Bull(name, defaultOptions);

            // Add error handler
            queue.on('error', (error) => {
                console.error(`❌ [Bull:${name}] Queue error:`, error.message);
            });

            // Add connection ready handler
            queue.on('ready', () => {
                console.log(`✅ [Bull:${name}] Connected to Redis`);
            });

            console.log(`🔴 [QueueFactory] Created Bull queue: "${name}" (Redis: ${redisUrl.split('@').pop()})`);

        } catch (error) {
            console.warn(`⚠️  [QueueFactory] Bull/Redis unavailable, falling back to MockQueue:`, error.message);
            queue = new MockQueue(name, options);
        }
    } else {
        // Development mode or no Redis
        const reason = !redisUrl ? 'REDIS_URL not set' : 'development mode';
        console.log(`📝 [QueueFactory] Creating MockQueue: "${name}" (${reason})`);
        queue = new MockQueue(name, options);
    }

    activeQueues.set(name, queue);
    return queue;
}

/**
 * Get an existing queue by name
 * @param {string} name - Queue name
 * @returns {Bull|MockQueue|null} Queue instance or null
 */
function getQueue(name) {
    return activeQueues.get(name) || null;
}

/**
 * Close all active queues gracefully
 * Useful for graceful shutdown
 */
async function closeAllQueues() {
    console.log(`🔒 [QueueFactory] Closing ${activeQueues.size} queue(s)...`);

    const closePromises = [];
    for (const [name, queue] of activeQueues) {
        closePromises.push(
            queue.close()
                .then(() => console.log(`   ✓ Closed queue: "${name}"`))
                .catch(err => console.error(`   ✗ Error closing queue "${name}":`, err.message))
        );
    }

    await Promise.all(closePromises);
    activeQueues.clear();
    console.log(`🔒 [QueueFactory] All queues closed`);
}

/**
 * Get stats for all active queues
 * @returns {Promise<object>} Queue statistics
 */
async function getAllQueueStats() {
    const stats = {};

    for (const [name, queue] of activeQueues) {
        if (queue.getStats) {
            // MockQueue
            stats[name] = queue.getStats();
        } else if (queue.getJobCounts) {
            // Bull queue
            stats[name] = {
                name,
                type: 'bull',
                ...(await queue.getJobCounts())
            };
        }
    }

    return stats;
}

/**
 * Check if using real Bull queues (production mode)
 * @returns {boolean}
 */
function isUsingRealQueues() {
    const firstQueue = activeQueues.values().next().value;
    return firstQueue && firstQueue.constructor.name === 'Queue';  // Bull queue class name
}

module.exports = {
    createQueue,
    getQueue,
    closeAllQueues,
    getAllQueueStats,
    isUsingRealQueues
};
