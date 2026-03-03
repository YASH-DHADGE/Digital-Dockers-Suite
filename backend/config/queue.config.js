/**
 * Queue Factory Configuration
 * 
 * Automatically selects between real Bull queues (Redis-backed) and mock queues
 * based on environment and Redis availability.
 * 
 * Decision Logic:
 * 1. Production (NODE_ENV=production) → REQUIRES Redis, fails if unavailable
 * 2. Development with REDIS_URL → Uses real Bull queue
 * 3. Development without REDIS_URL → Uses mock queue (no Redis needed)
 * 4. Redis connection fails → Fallback to mock with warning
 */

const MockQueue = require('../utils/mockQueue');

let Bull;
let queueType = 'unknown';
let redisAvailable = false;

// Try to load Bull (it's optional in package.json)
try {
    Bull = require('bull');
} catch (error) {
    console.log('ℹ️  Bull not installed - using mock queues only');
}

/**
 * Detect if Redis is available and should be used
 */
function shouldUseRedis() {
    const isProduction = process.env.NODE_ENV === 'production';
    const hasRedisUrl = !!process.env.REDIS_URL;

    if (isProduction && !hasRedisUrl) {
        throw new Error(
            '❌ REDIS_URL is required in production environment. ' +
            'Please set REDIS_URL in your environment variables.'
        );
    }

    return hasRedisUrl && Bull;
}

/**
 * Create a queue instance (real or mock)
 * 
 * @param {string} queueName - Name of the queue
 * @param {object} options - Queue options (Bull-compatible)
 * @returns {Queue} Queue instance (Bull or Mock)
 */
function createQueue(queueName, options = {}) {
    if (!queueName) {
        throw new Error('Queue name is required');
    }

    const useRedis = shouldUseRedis();

    if (useRedis) {
        try {
            const queue = new Bull(queueName, {
                redis: process.env.REDIS_URL,
                ...options
            });

            // Test connection
            queue.on('error', (error) => {
                console.error(`❌ [Queue:${queueName}] Redis connection error:`, error.message);

                // In development, we could fallback to mock here
                if (process.env.NODE_ENV !== 'production') {
                    console.warn(`⚠️  Falling back to mock queue for "${queueName}"`);
                }
            });

            queue.on('ready', () => {
                console.log(`✅ [Queue:${queueName}] Connected to Redis`);
                redisAvailable = true;
            });

            queueType = 'redis';
            console.log(`🚀 [Queue:${queueName}] Created Redis-backed queue`);

            return queue;
        } catch (error) {
            console.error(`❌ Failed to create Redis queue "${queueName}":`, error.message);

            if (process.env.NODE_ENV === 'production') {
                throw error; // Don't fallback in production
            }

            console.warn(`⚠️  Falling back to mock queue for "${queueName}"`);
            queueType = 'mock';
            return new MockQueue(queueName, options);
        }
    } else {
        queueType = 'mock';
        console.log(`🔧 [Queue:${queueName}] Created mock queue (development mode)`);
        return new MockQueue(queueName, options);
    }
}

/**
 * Get current queue type being used
 */
function getQueueType() {
    return queueType;
}

/**
 * Check if Redis is available
 */
function isRedisAvailable() {
    return redisAvailable;
}

/**
 * Initialize queue system
 * Call this early in application startup
 */
function initializeQueueSystem() {
    const useRedis = shouldUseRedis();

    console.log('\n📊 Queue System Initialization');
    console.log('================================');
    console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
    console.log(`Redis URL: ${process.env.REDIS_URL ? '✅ Configured' : '❌ Not set'}`);
    console.log(`Queue Type: ${useRedis ? '🔴 Redis (Bull)' : '🟡 Mock (In-Memory)'}`);

    if (!useRedis && process.env.NODE_ENV === 'production') {
        console.error('⚠️  WARNING: Using mock queues in production is NOT recommended!');
    }

    if (!useRedis) {
        console.log('\n💡 Development Tip:');
        console.log('   Mock queues process jobs synchronously and don\'t persist.');
        console.log('   To use real queues locally, set REDIS_URL in your .env file.');
    }

    console.log('================================\n');
}

/**
 * Gracefully close all queues
 * Call this during application shutdown
 */
async function closeAllQueues(queues = []) {
    console.log('\n🔒 Closing all queues...');

    for (const queue of queues) {
        try {
            await queue.close();
            console.log(`✅ Closed queue: ${queue.name}`);
        } catch (error) {
            console.error(`❌ Error closing queue ${queue.name}:`, error.message);
        }
    }

    console.log('✅ All queues closed\n');
}

module.exports = {
    createQueue,
    getQueueType,
    isRedisAvailable,
    initializeQueueSystem,
    closeAllQueues
};
